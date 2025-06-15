import React, { useState, useCallback } from 'react';
import { Upload, Image, X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UploadedImage {
  file: File;
  url: string;
  id: string;
}

interface ImageUploaderProps {
  onImageUpload?: (file: File) => void; // For backward compatibility
  onImagesUpload?: (files: UploadedImage[]) => void; // For multi-upload
  uploadedImage?: string; // For backward compatibility
  uploadedImages?: UploadedImage[]; // For multi-upload
  onClearImage?: () => void; // For backward compatibility
  onClearImages?: () => void; // For multi-upload
  onRemoveImage?: (id: string) => void; // For removing individual images
  isProcessing?: boolean;
  multiUpload?: boolean; // Toggle between single and multi-upload mode
  maxImages?: number;
}

const ImageUploader = ({ 
  onImageUpload,
  onImagesUpload,
  uploadedImage, 
  uploadedImages = [],
  onClearImage,
  onClearImages,
  onRemoveImage,
  isProcessing = false,
  multiUpload = false,
  maxImages = 10
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
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (multiUpload) {
      const remainingSlots = maxImages - uploadedImages.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);
      
      if (filesToAdd.length > 0 && onImagesUpload) {
        const newImages: UploadedImage[] = filesToAdd.map(file => ({
          file,
          url: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9)
        }));
        onImagesUpload([...uploadedImages, ...newImages]);
      }
    } else {
      const imageFile = imageFiles[0];
      if (imageFile && onImageUpload) {
        onImageUpload(imageFile);
      }
    }
  }, [multiUpload, maxImages, uploadedImages, onImagesUpload, onImageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (multiUpload) {
      const remainingSlots = maxImages - uploadedImages.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);
      
      if (filesToAdd.length > 0 && onImagesUpload) {
        const newImages: UploadedImage[] = filesToAdd.map(file => ({
          file,
          url: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9)
        }));
        onImagesUpload([...uploadedImages, ...newImages]);
      }
    } else {
      const imageFile = imageFiles[0];
      if (imageFile && onImageUpload) {
        onImageUpload(imageFile);
      }
    }
    
    // Reset input
    e.target.value = '';
  }, [multiUpload, maxImages, uploadedImages, onImagesUpload, onImageUpload]);

  const handleRemoveImage = useCallback((id: string) => {
    if (onRemoveImage) {
      onRemoveImage(id);
    }
  }, [onRemoveImage]);

  // Single image mode (backward compatibility)
  if (!multiUpload) {
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
  }

  // Multi-image mode
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Upload Area */}
      {uploadedImages.length < maxImages && (
        <Card className="relative overflow-hidden bg-white/10 backdrop-blur-lg border-2 border-dashed border-white/30 transition-all duration-300 hover:border-white/50 mb-6">
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
                Drop your images here
              </h3>
              <p className="text-white/70 mb-6">
                Upload up to {maxImages} images at once or click to browse
              </p>
              
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                onClick={() => document.getElementById('multi-file-input')?.click()}
                disabled={isProcessing}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Images ({uploadedImages.length}/{maxImages})
              </Button>
              
              <input
                id="multi-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="mt-6 text-sm text-white/50">
                Supports: JPG, PNG, GIF, WebP (Max 10MB each)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Uploaded Images ({uploadedImages.length}/{maxImages})
            </h3>
            <Button
              onClick={onClearImages}
              variant="outline"
              className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {uploadedImages.map((image) => (
              <Card key={image.id} className="relative bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt="Uploaded"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        onClick={() => handleRemoveImage(image.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300"
                        disabled={isProcessing}
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/70 truncate">
                    {image.file.name}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
export type { UploadedImage };
