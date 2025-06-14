import React, { useState, useEffect } from 'react';
import { Zap, Download, Settings, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { stabilityAI, UpscaleProgress, StabilityAIService } from '@/services/stabilityAI';
import { useToast } from '@/hooks/use-toast';

interface ImageProcessorProps {
  originalImage: string;
  originalFile: File;
  isProcessing: boolean;
  onStartProcessing: (scale: number) => void;
  processedImage?: string;
  progress: number;
  onProcessingComplete: (imageBlob: Blob, scale: number) => void;
  onProcessingError: (error: string) => void;
  onProgressUpdate?: (progress: number) => void;
}

const ImageProcessor = ({
  originalImage,
  originalFile,
  isProcessing,
  onStartProcessing,
  processedImage,
  progress,
  onProcessingComplete,
  onProcessingError,
  onProgressUpdate
}: ImageProcessorProps) => {
  const [selectedScale, setSelectedScale] = useState<number>(2);
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
  const [processedDimensions, setProcessedDimensions] = useState<{width: number, height: number} | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [estimatedCredits, setEstimatedCredits] = useState<number>(1);
  const { toast } = useToast();

  const scaleOptions = [
    { value: 2, label: '2x (Recommended)', description: 'Best quality/speed balance' },
    { value: 4, label: '4x (High Quality)', description: 'Better for smaller images' },
    { value: 8, label: '8x (Maximum)', description: 'Extreme upscaling' }
  ];

  // Update estimated credits when scale changes
  useEffect(() => {
    if (originalFile) {
      StabilityAIService.estimateCreditCost(originalFile, selectedScale)
        .then(setEstimatedCredits)
        .catch(() => setEstimatedCredits(selectedScale)); // Fallback to scale as credit cost
    }
  }, [originalFile, selectedScale]);

  // Get original image dimensions
  useEffect(() => {
    if (originalImage) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = originalImage;
    }
  }, [originalImage]);

  // Get processed image dimensions
  useEffect(() => {
    if (processedImage) {
      const img = new Image();
      img.onload = () => {
        setProcessedDimensions({ width: img.width, height: img.height });
      };
      img.src = processedImage;
    }
  }, [processedImage]);

  const handleUpscale = async () => {
    if (!originalFile) {
      toast({
        title: "Error",
        description: "No image file available for processing.",
        variant: "destructive",
      });
      return;
    }

    try {
      onStartProcessing(selectedScale);
      setProgressMessage('Initializing...');

      const progressCallback = (progressData: UpscaleProgress) => {
        setProgressMessage(progressData.message || '');
        if (progressData.progress && onProgressUpdate) {
          onProgressUpdate(progressData.progress);
        }
        if (progressData.status === 'failed') {
          onProcessingError(progressData.message || 'Processing failed');
        }
      };

      const upscaledBlob = await stabilityAI.upscaleImage(
        originalFile,
        { scale: selectedScale, format: 'png' },
        progressCallback
      );

      onProcessingComplete(upscaledBlob, selectedScale);
      
      toast({
        title: "Success!",
        description: `Image upscaled ${selectedScale}x successfully. Estimated ${estimatedCredits} credit(s) used.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onProcessingError(errorMessage);
      
      toast({
        title: "Upscaling Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `upscaled-image-${selectedScale}x.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Control Panel */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Upscaling Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-white/90 text-sm font-medium mb-2 block">
              Upscaling Factor
            </label>
            <Select value={selectedScale.toString()} onValueChange={(value) => setSelectedScale(Number(value))}>
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

          <div className="space-y-2">
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Estimated cost: {estimatedCredits} credit{estimatedCredits !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          </div>

          <Button
            onClick={handleUpscale}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Upscale Image {selectedScale}x
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>{progressMessage || 'Processing...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg flex flex-col gap-1">
              Original
              {originalDimensions && (
                <span className="text-sm text-white/70 font-normal">
                  {originalDimensions.width} × {originalDimensions.height} px
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg flex flex-col gap-1">
              <div className="flex items-center gap-2">
                Upscaled {selectedScale}x
                {processedImage && <Star className="w-4 h-4 text-yellow-400" />}
              </div>
              {processedDimensions && (
                <span className="text-sm text-white/70 font-normal">
                  {processedDimensions.width} × {processedDimensions.height} px
                  <span className="text-green-400 ml-2">
                    (+{Math.round(((processedDimensions.width * processedDimensions.height) / (originalDimensions?.width || 1 * originalDimensions?.height || 1) - 1) * 100)}% pixels)
                  </span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={processedImage}
                    alt="Upscaled"
                    className="w-full h-auto rounded-lg shadow-lg animate-fade-in"
                  />
                  <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded text-xs font-semibold">
                    {selectedScale}x Enhanced
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
              </div>
            ) : (
              <div className="aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-white/50">
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Upscaled image will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageProcessor;
