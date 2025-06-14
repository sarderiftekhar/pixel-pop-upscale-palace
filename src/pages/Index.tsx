import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Star, Heart, LogIn } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import ImageProcessor from '@/components/ImageProcessor';
import UserDashboard from '@/components/UserDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, profile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
            Transform your images with AI-powered upscaling. Make any image crystal clear and stunning in seconds.
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
                New users get 10 free credits!
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
            {!uploadedImageUrl ? (
              <ImageUploader
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImageUrl}
                onClearImage={handleClearImage}
                isProcessing={isProcessing}
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
