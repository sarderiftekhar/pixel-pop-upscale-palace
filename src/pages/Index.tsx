import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Star, Heart, LogIn, Images, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import ImageUploader, { UploadedImage } from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import MultiImageProcessor, { ProcessedImage } from '@/components/MultiImageProcessor';
import UserDashboard from '@/components/UserDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  // Single upload state (existing)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Multi upload state (new)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [multiUploadMode, setMultiUploadMode] = useState(false);

  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Single image handlers (existing)
  const handleImageUpload = useCallback((file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setProcessedImageUrl(''); // Reset processed image
  }, []);

  const handleClearImage = useCallback(() => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }
    setUploadedFile(null);
    setUploadedImageUrl('');
    setProcessedImageUrl('');
    setProgress(0);
    setIsProcessing(false);
  }, [uploadedImageUrl, processedImageUrl]);

  // Multi image handlers (new)
  const handleImagesUpload = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    setProcessedImages([]); // Reset processed images
  }, []);

  const handleClearImages = useCallback(() => {
    // Clean up URLs
    uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.url);
    });
    processedImages.forEach(image => {
      if (image.processedUrl) {
        URL.revokeObjectURL(image.processedUrl);
      }
    });
    setUploadedImages([]);
    setProcessedImages([]);
    setIsProcessing(false);
  }, [uploadedImages, processedImages]);

  const handleRemoveImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Mode toggle handler
  const handleModeToggle = useCallback(() => {
    // Clear current state when switching modes
    if (multiUploadMode) {
      // Switching to single mode
      handleClearImages();
    } else {
      // Switching to multi mode
      handleClearImage();
    }
    setMultiUploadMode(!multiUploadMode);
  }, [multiUploadMode, handleClearImages, handleClearImage]);

  // Single image processing handlers (existing)
  const handleStartProcessing = useCallback((scale: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upscale images.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!profile || profile.credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to upscale an image.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
  }, [user, profile, toast, navigate]);

  const handleProcessingComplete = useCallback(async (imageBlob: Blob, scale: number) => {
    try {
      // Deduct credit and record usage
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: profile!.credits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile!.id,
          type: 'usage',
          amount: -1,
          description: `Used 1 credit for image upscaling (${scale}x)`,
        });

      if (transactionError) throw transactionError;

      await refreshProfile();
      
      // Create URL for the processed image
      const processedUrl = URL.createObjectURL(imageBlob);
      setProcessedImageUrl(processedUrl);
      setIsProcessing(false);
      setProgress(100);
      
      toast({
        title: "Image Upscaled!",
        description: `Your image has been upscaled ${scale}x successfully!`,
      });
    } catch (error) {
      console.error('Error recording usage:', error);
      toast({
        title: "Processing Error",
        description: "Image was upscaled but failed to record usage. Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [profile, refreshProfile, toast]);

  const handleProcessingError = useCallback((error: string) => {
    setIsProcessing(false);
    setProgress(0);
    toast({
      title: "Upscaling Failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const handleProgressUpdate = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  // Multi image processing handlers (new)
  const handleMultiProcessingComplete = useCallback((results: ProcessedImage[]) => {
    setProcessedImages(results);
    setIsProcessing(false);
    
    const completedCount = results.filter(img => img.status === 'completed').length;
    const failedCount = results.filter(img => img.status === 'failed').length;
    
    toast({
      title: "Batch Processing Complete!",
      description: `${completedCount} images processed successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
    });
  }, [toast]);

  const handleMultiProcessingError = useCallback((error: string) => {
    setIsProcessing(false);
    toast({
      title: "Batch Processing Error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const handleCreditDeduction = useCallback(async (amount: number) => {
    try {
      // Deduct credits and record usage
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: profile!.credits - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile!.id,
          type: 'usage',
          amount: -amount,
          description: `Used ${amount} credit${amount !== 1 ? 's' : ''} for batch image upscaling`,
        });

      if (transactionError) throw transactionError;

      await refreshProfile();
    } catch (error) {
      console.error('Error recording credit usage:', error);
      toast({
        title: "Credit Deduction Error",
        description: "Failed to record credit usage. Please contact support.",
        variant: "destructive",
      });
    }
  }, [profile, refreshProfile, toast]);

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Lightning Fast",
      description: "AI-powered upscaling in seconds"
    },
    {
      icon: <Star className="w-8 h-8 text-purple-400" />,
      title: "Premium Quality",
      description: "Up to 8x resolution enhancement"
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-400" />,
      title: "Credit System",
      description: "Pay only for what you use"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* User Dashboard */}
      {user && <UserDashboard />}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-shimmer">
              PixelBoost
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            Transform your images with AI-powered upscaling. Upload single images or batch process up to 10 images at once.
          </p>

          {!user && (
            <div className="mb-8">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Get Started
              </Button>
              <p className="text-white/60 text-sm mt-2">
                New users get 100 free credits!
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {user && (
          <div className="space-y-8">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 max-w-2xl w-full">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Upload Mode</h3>
                    <p className="text-white/70 text-sm">Choose between single or batch processing</p>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-2">
                    <button
                      onClick={() => !multiUploadMode || handleModeToggle()}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                        !multiUploadMode 
                          ? 'bg-purple-500 text-white shadow-lg' 
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                      disabled={isProcessing}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Single Image</span>
                    </button>
                    
                    <button
                      onClick={() => multiUploadMode || handleModeToggle()}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                        multiUploadMode 
                          ? 'bg-purple-500 text-white shadow-lg' 
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                      disabled={isProcessing}
                    >
                      <Images className="w-5 h-5" />
                      <span className="font-medium">Multi Upload</span>
                    </button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      multiUploadMode 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        multiUploadMode ? 'bg-purple-400' : 'bg-blue-400'
                      } animate-pulse`}></div>
                      {multiUploadMode ? 'Batch mode: Up to 10 images' : 'Single image mode'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Single Image Mode */}
            {!multiUploadMode && (
              <>
                {!uploadedImageUrl ? (
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    uploadedImage={uploadedImageUrl}
                    onClearImage={handleClearImage}
                    isProcessing={isProcessing}
                    multiUpload={false}
                  />
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleClearImage}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Upload New Image
                      </Button>
                    </div>
                    
                    <ImageProcessor
                      originalImage={uploadedImageUrl}
                      originalFile={uploadedFile!}
                      isProcessing={isProcessing}
                      onStartProcessing={handleStartProcessing}
                      processedImage={processedImageUrl}
                      progress={progress}
                      onProcessingComplete={handleProcessingComplete}
                      onProcessingError={handleProcessingError}
                      onProgressUpdate={handleProgressUpdate}
                    />
                  </div>
                )}
              </>
            )}

            {/* Multi Image Mode */}
            {multiUploadMode && (
              <div className="space-y-8">
                <ImageUploader
                  onImagesUpload={handleImagesUpload}
                  uploadedImages={uploadedImages}
                  onClearImages={handleClearImages}
                  onRemoveImage={handleRemoveImage}
                  isProcessing={isProcessing}
                  multiUpload={true}
                  maxImages={10}
                />

                {uploadedImages.length > 0 && (
                  <MultiImageProcessor
                    images={uploadedImages}
                    onProcessingComplete={handleMultiProcessingComplete}
                    onProcessingError={handleMultiProcessingError}
                    onCreditDeduction={handleCreditDeduction}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-white/60">
          <p className="text-sm">
            Made with ❤️ for creators who demand the best quality
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
