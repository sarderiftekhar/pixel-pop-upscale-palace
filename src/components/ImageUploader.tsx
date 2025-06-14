
import React, { useState, useCallback } from 'react';
import { Upload, Image, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  uploadedImage?: string;
  onClearImage: () => void;
  isProcessing?: boolean;
}

const ImageUploader = ({ 
  onImageUpload, 
  uploadedImage, 
  onClearImage, 
  isProcessing = false 
}: ImageUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploadedImage ? (
        <Card className="relative overflow-hidden bg-white/10 backdrop-blur-lg border-2 border-dashed border-white/30 transition-all duration-300 hover:border-white/50">
          <CardContent className="p-8">
            <div
              className={`relative text-center transition-all duration-300 ${
                isDragOver ? 'scale-105 opacity-80' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-float">
                  <Upload className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Drop your image here
              </h3>
              <p className="text-white/70 mb-6">
                or click to browse from your device
              </p>
              
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isProcessing}
              >
                <Image className="w-5 h-5 mr-2" />
                Choose Image
              </Button>
              
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="mt-6 text-sm text-white/50">
                Supports: JPG, PNG, GIF, WebP (Max 10MB)
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  onClick={onClearImage}
                  className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300"
                  disabled={isProcessing}
                  title="Clear image"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUploader;
