import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Zap, Download, Settings, Star, AlertCircle, CheckCircle, XCircle, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { stabilityAI, UpscaleProgress, StabilityAIService } from '@/services/stabilityAI';
import { useToast } from '@/hooks/use-toast';
import { UploadedImage } from './ImageUploader';

interface ProcessedImage extends UploadedImage {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  processedUrl?: string;
  processedBlob?: Blob;
  error?: string;
  scale?: number;
  estimatedCredits?: number;
}

interface MultiImageProcessorProps {
  images: UploadedImage[];
  onProcessingComplete: (results: ProcessedImage[]) => void;
  onProcessingError: (error: string) => void;
  onCreditDeduction: (amount: number) => void;
}

const MultiImageProcessor = ({
  images,
  onProcessingComplete,
  onProcessingError,
  onCreditDeduction
}: MultiImageProcessorProps) => {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [selectedScale, setSelectedScale] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [maxConcurrentProcessing, setMaxConcurrentProcessing] = useState(2); // Default to 2, max 3
  const [totalEstimatedCredits, setTotalEstimatedCredits] = useState<number>(0);
  const [totalUsedCredits, setTotalUsedCredits] = useState<number>(0);
  const { toast } = useToast();

  // Use refs to avoid stale closure issues
  const processedImagesRef = useRef<ProcessedImage[]>([]);
  const isPausedRef = useRef(false);
  const selectedScaleRef = useRef(2);

  // Keep refs in sync with state
  useEffect(() => {
    processedImagesRef.current = processedImages;
  }, [processedImages]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    selectedScaleRef.current = selectedScale;
  }, [selectedScale]);

  const scaleOptions = [
    { value: 2, label: '2x (Recommended)', description: 'Best quality/speed balance' },
    { value: 4, label: '4x (High Quality)', description: 'Better for smaller images' },
    { value: 8, label: '8x (Maximum)', description: 'Extreme upscaling' }
  ];

  // Initialize processed images when images prop changes
  useEffect(() => {
    const initializeImages = async () => {
      const initialized = await Promise.all(
        images.map(async (image) => {
          const estimatedCredits = await StabilityAIService.estimateCreditCost(image.file, selectedScale)
            .catch(() => selectedScale); // Fallback to scale as credit cost
          
          return {
            ...image,
            status: 'pending' as const,
            progress: 0,
            scale: selectedScale,
            estimatedCredits
          };
        })
      );
      
      setProcessedImages(initialized);
      
      // Calculate total estimated credits
      const total = initialized.reduce((sum, img) => sum + (img.estimatedCredits || selectedScale), 0);
      setTotalEstimatedCredits(total);
    };

    if (images.length > 0) {
      initializeImages();
    }
  }, [images, selectedScale]);

  // Update estimated credits when scale changes (debounced to prevent excessive updates)
  useEffect(() => {
    const updateEstimates = async () => {
      const updated = await Promise.all(
        processedImages.map(async (image) => {
          if (image.status === 'pending' || image.status === 'failed') {
            const estimatedCredits = await StabilityAIService.estimateCreditCost(image.file, selectedScale)
              .catch(() => selectedScale);
            return { ...image, scale: selectedScale, estimatedCredits };
          }
          return image;
        })
      );
      
      setProcessedImages(updated);
      
      // Recalculate total
      const total = updated.reduce((sum, img) => sum + (img.estimatedCredits || selectedScale), 0);
      setTotalEstimatedCredits(total);
    };

    // Debounce the update to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      if (processedImages.length > 0 && !isProcessing) {
        updateEstimates();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedScale, processedImages.length, isProcessing]); // Removed processedImages dependency to prevent loops

  const processImageAtIndex = useCallback(async (imageIndex: number) => {
    const imageToProcess = processedImagesRef.current[imageIndex];
    if (!imageToProcess || imageToProcess.status !== 'pending') {
      return;
    }

    console.log(`🚀 Starting to process image ${imageIndex + 1}: ${imageToProcess.file.name}`);

    // Update status to processing
    setProcessedImages(prev => {
      const updated = [...prev];
      updated[imageIndex] = { ...updated[imageIndex], status: 'processing' as const, progress: 0 };
      processedImagesRef.current = updated;
      return updated;
    });

    try {
      const progressCallback = (progressData: UpscaleProgress) => {
        // Throttle progress updates more aggressively to reduce screen shaking
        const progress = progressData.progress || 0;
        const roundedProgress = Math.round(progress / 10) * 10; // Round to nearest 10%
        
        setProcessedImages(prev => {
          const current = prev[imageIndex];
          // Only update if progress changed significantly (10% or more)
          if (current && Math.abs(current.progress - roundedProgress) >= 10) {
            const updated = [...prev];
            updated[imageIndex] = { ...updated[imageIndex], progress: roundedProgress };
            processedImagesRef.current = updated;
            return updated;
          }
          return prev; // No update needed
        });

        if (progressData.status === 'failed') {
          throw new Error(progressData.message || 'Processing failed');
        }
      };

      const upscaledBlob = await stabilityAI.upscaleImage(
        imageToProcess.file,
        { scale: selectedScaleRef.current, format: 'png' },
        progressCallback
      );

      const processedUrl = URL.createObjectURL(upscaledBlob);
      
      // Update as completed with force re-render
      const completedImage = {
        ...imageToProcess,
        status: 'completed' as const, 
        progress: 100,
        processedUrl,
        processedBlob: upscaledBlob,
        scale: selectedScaleRef.current
      };

      setProcessedImages(prev => {
        const updated = [...prev];
        updated[imageIndex] = completedImage;
        processedImagesRef.current = updated;
        console.log(`✅ Image ${imageIndex + 1} completed successfully:`, {
          hasBlob: !!upscaledBlob,
          hasUrl: !!processedUrl,
          fileName: imageToProcess.file.name,
          status: completedImage.status
        });
        return updated;
      });

      // Deduct credits
      const creditsUsed = imageToProcess.estimatedCredits || selectedScaleRef.current;
      setTotalUsedCredits(prev => prev + creditsUsed);
      onCreditDeduction(creditsUsed);

      toast({
        title: "Image Processed!",
        description: `${imageToProcess.file.name} upscaled ${selectedScaleRef.current}x successfully!`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update as failed with force re-render
      const failedImage = {
        ...imageToProcess,
        status: 'failed' as const, 
        progress: 0,
        error: errorMessage
      };

      setProcessedImages(prev => {
        const updated = [...prev];
        updated[imageIndex] = failedImage;
        processedImagesRef.current = updated;
        return updated;
      });

      toast({
        title: "Processing Failed",
        description: `${imageToProcess.file.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [onCreditDeduction, toast]);

  // Add a ref to prevent multiple simultaneous calls to startParallelProcessing
  const isProcessingQueueRef = useRef(false);

  const startParallelProcessing = useCallback(async () => {
    if (isPausedRef.current) {
      console.log('⏸️ Processing paused, skipping');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isProcessingQueueRef.current) {
      console.log('🔄 Queue already being processed, skipping');
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      const currentImages = processedImagesRef.current;
      const pendingIndices = currentImages
        .map((img, index) => ({ img, index }))
        .filter(({ img }) => img.status === 'pending')
        .map(({ index }) => index);
      
      const processingCount = currentImages.filter(img => img.status === 'processing').length;
      const availableSlots = maxConcurrentProcessing - processingCount;
      
      // Reduce console logging to improve performance
      if (pendingIndices.length > 0 || processingCount > 0) {
        console.log('🔍 Queue status:', {
          pending: pendingIndices.length,
          processing: processingCount,
          completed: currentImages.filter(img => img.status === 'completed').length,
          availableSlots
        });
      }
      
      if (pendingIndices.length === 0 && processingCount === 0) {
        // All images processed
        console.log('✅ All images processed, finishing batch');
        setIsProcessing(false);
        setCurrentProcessingIndex(-1);
        onProcessingComplete(currentImages);
        return;
      }

      // Start processing up to available slots
      const indicesToProcess = pendingIndices.slice(0, availableSlots);
      
              if (indicesToProcess.length > 0) {
          console.log(`🚀 Processing ${indicesToProcess.length} images`);
          
          // Process images in parallel without recursive calls
          const processingPromises = indicesToProcess.map(index => 
            processImageAtIndex(index).catch(error => {
              console.error(`❌ Image ${index} failed:`, error.message);
              return null; // Continue processing other images even if one fails
            })
          );

          // Wait for at least one image to complete before checking queue again
          Promise.race(processingPromises).then(() => {
            setTimeout(() => {
              if (!isPausedRef.current) {
                startParallelProcessing();
              }
            }, 1000); // Increased delay to reduce resource usage
          });
        }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [processImageAtIndex, onProcessingComplete, maxConcurrentProcessing]);

  const handleStartProcessing = useCallback(() => {
    setIsProcessing(true);
    setIsPaused(false);
    setTotalUsedCredits(0);
    startParallelProcessing();
  }, [startParallelProcessing]);

  const handlePauseResume = useCallback(() => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume processing
      startParallelProcessing();
    }
  }, [isPaused, startParallelProcessing]);

  const handleRetryFailed = useCallback(() => {
    setProcessedImages(prev => prev.map(img => 
      img.status === 'failed' ? { ...img, status: 'pending' as const, progress: 0, error: undefined } : img
    ));
  }, []);

  const handleDownloadAll = useCallback(() => {
    const completedImages = processedImages.filter(img => img.status === 'completed' && img.processedBlob);
    
    completedImages.forEach((image, index) => {
      if (image.processedBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(image.processedBlob);
        link.download = `upscaled-${image.file.name.split('.')[0]}-${selectedScale}x.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Add delay between downloads to avoid browser blocking
        if (index < completedImages.length - 1) {
          setTimeout(() => {}, 100);
        }
      }
    });

    toast({
      title: "Downloads Started",
      description: `Downloading ${completedImages.length} processed images...`,
    });
  }, [processedImages, selectedScale, toast]);

  const statusCounts = useMemo(() => {
    const counts = {
      completed: 0,
      failed: 0,
      pending: 0,
      processing: 0
    };
    
    processedImages.forEach(img => {
      counts[img.status]++;
    });
    
    return counts;
  }, [processedImages]);

  const { completed: completedCount, failed: failedCount, pending: pendingCount, processing: processingCount } = statusCounts;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Control Panel */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Batch Processing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">
                Upscaling Factor
              </label>
              <Select 
                value={selectedScale.toString()} 
                onValueChange={(value) => setSelectedScale(Number(value))}
                disabled={isProcessing}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {scaleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-gray-800">
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-400">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">
                Concurrent Processing
              </label>
              <Select 
                value={maxConcurrentProcessing.toString()} 
                onValueChange={(value) => setMaxConcurrentProcessing(Number(value))}
                disabled={isProcessing}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="1" className="text-white hover:bg-gray-800">
                    <div className="flex flex-col">
                      <span className="font-medium">1 at a time</span>
                      <span className="text-xs text-gray-400">Sequential (safest)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2" className="text-white hover:bg-gray-800">
                    <div className="flex flex-col">
                      <span className="font-medium">2 at a time</span>
                      <span className="text-xs text-gray-400">Moderate speed (default)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3" className="text-white hover:bg-gray-800">
                    <div className="flex flex-col">
                      <span className="font-medium">3 at a time</span>
                      <span className="text-xs text-gray-400">Fastest</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/90 text-sm font-medium mb-2 block">
                Processing Status
              </label>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                  {pendingCount} Pending
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                  {processingCount} Processing
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  {completedCount} Completed
                </Badge>
                {failedCount > 0 && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                    {failedCount} Failed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/20">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Estimated total cost: {totalEstimatedCredits} credits | Used: {totalUsedCredits} credits
              {isProcessing && (
                <span className="ml-2 text-yellow-300">
                  • Processing up to {maxConcurrentProcessing} images simultaneously
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            {!isProcessing ? (
              <Button
                onClick={handleStartProcessing}
                disabled={processedImages.length === 0 || completedCount === processedImages.length}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Batch Processing
              </Button>
            ) : (
              <Button
                onClick={handlePauseResume}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
              >
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}

            {failedCount > 0 && (
              <Button
                onClick={handleRetryFailed}
                disabled={isProcessing}
                variant="outline"
                className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Failed ({failedCount})
              </Button>
            )}

            {completedCount > 0 && (
              <Button
                onClick={handleDownloadAll}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All ({completedCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedImages.map((image, index) => (
          <Card key={image.id} className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm truncate flex-1 mr-2">
                  {image.file.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {image.status === 'pending' && <Badge className="bg-gray-500/20 text-gray-300 min-w-[70px] justify-center">Pending</Badge>}
                  {image.status === 'processing' && <Badge className="bg-yellow-500/20 text-yellow-300 min-w-[70px] justify-center">Processing</Badge>}
                  {image.status === 'completed' && <Badge className="bg-green-500/20 text-green-300 min-w-[70px] justify-center"><CheckCircle className="w-3 h-3 mr-1" />Done</Badge>}
                  {image.status === 'failed' && <Badge className="bg-red-500/20 text-red-300 min-w-[70px] justify-center"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>}
                  {image.status === 'paused' && <Badge className="bg-orange-500/20 text-orange-300 min-w-[70px] justify-center">Paused</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Original Image */}
                <div>
                  <p className="text-xs text-white/70 mb-1">Original</p>
                  <img
                    src={image.url}
                    alt="Original"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>

                {/* Processed Image */}
                <div>
                  <p className="text-xs text-white/70 mb-1">
                    Upscaled {image.scale || selectedScale}x
                    {image.status === 'completed' && <Star className="w-3 h-3 inline ml-1 text-yellow-400" />}
                  </p>
                  {image.processedUrl ? (
                    <img
                      src={image.processedUrl}
                      alt="Processed"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white/50">
                        {/* Always reserve space for spinner to prevent layout shift */}
                        <div className="h-6 w-6 mx-auto mb-1 flex items-center justify-center">
                          {image.status === 'processing' && (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          )}
                        </div>
                        <p className="text-xs">
                          {image.status === 'pending' && 'Waiting...'}
                          {image.status === 'processing' && 'Processing...'}
                          {image.status === 'failed' && 'Failed'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar - Always reserve space */}
              <div className="space-y-1 min-h-[24px]">
                {(image.status === 'processing' || image.status === 'completed') && (
                  <>
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Progress</span>
                      <span>{Math.round(image.progress)}%</span>
                    </div>
                    <Progress value={image.progress} className="h-2" />
                  </>
                )}
              </div>

              {/* Error Message */}
              {image.status === 'failed' && image.error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <XCircle className="h-3 w-3 text-red-400" />
                  <AlertDescription className="text-red-300 text-xs">
                    {image.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Individual Download Button */}
              {image.status === 'completed' && (image.processedBlob || image.processedUrl) && (
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    if (image.processedBlob) {
                      // Use blob if available (preferred)
                      link.href = URL.createObjectURL(image.processedBlob);
                    } else if (image.processedUrl) {
                      // Fallback to URL if blob is missing
                      link.href = image.processedUrl;
                    }
                    link.download = `upscaled-${image.file.name.split('.')[0]}-${image.scale || selectedScale}x.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              )}

              {/* Debug info for completed images without download */}
              {image.status === 'completed' && !image.processedBlob && !image.processedUrl && (
                <div className="text-xs text-red-400 text-center">
                  ⚠️ Download unavailable - missing processed data
                </div>
              )}

              {/* Credit Cost */}
              <div className="text-xs text-white/50 text-center">
                Cost: {image.estimatedCredits || selectedScale} credit{(image.estimatedCredits || selectedScale) !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MultiImageProcessor;
export type { ProcessedImage }; 