import axios from 'axios';

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/upscale/fast';

export interface UpscaleOptions {
  scale: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface UpscaleProgress {
  progress: number;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}

export class StabilityAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🔧 StabilityAI Service initialized');
    console.log('🔑 API Key present:', apiKey ? 'Yes' : 'No');
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('🔑 API Key starts with sk-:', apiKey?.startsWith('sk-') || false);
    
    if (!apiKey) {
      console.error('❌ No API key provided! Make sure VITE_STABILITY_API_KEY is set in your .env file');
    }
  }

  async upscaleImage(
    imageFile: File,
    options: UpscaleOptions,
    onProgress?: (progress: UpscaleProgress) => void
  ): Promise<Blob> {
    try {
      // Validate image file
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image file.');
      }

      // Check file size (max 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024;
      if (imageFile.size > maxSizeInBytes) {
        throw new Error('Image file size must be less than 10MB.');
      }

      // Prepare form data for v2beta fast upscaler API
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('output_format', options.format || 'png');
      
      // Add prompt for better quality (optional for fast upscaler)
      if (options.scale) {
        formData.append('prompt', 'high quality, detailed, sharp, professional photography');
      }

      onProgress?.({ progress: 10, status: 'processing', message: 'Sending image to Stability AI Fast Upscaler...' });

      const response = await axios.post(STABILITY_API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*',
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        timeout: 45000, // 45 seconds timeout (fast upscaler is quicker)
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress?.({ 
            progress: Math.min(progress * 0.3, 30), 
            status: 'processing', 
            message: 'Uploading image...' 
          });
        },
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress?.({ 
            progress: 30 + Math.min(progress * 0.7, 70), 
            status: 'processing', 
            message: 'Fast upscaling and downloading image...' 
          });
        },
      });

      onProgress?.({ progress: 100, status: 'completed', message: 'Image fast upscaled successfully!' });

      return response.data;
    } catch (error) {
      console.error('🚨 Stability AI upscaling error:', error);
      
      let errorMessage = 'Failed to upscale image. Please try again.';
      
      if (axios.isAxiosError(error)) {
        console.log('📊 Error details:');
        console.log('  - Status:', error.response?.status);
        console.log('  - Status Text:', error.response?.statusText);
        console.log('  - Response Data:', error.response?.data);
        console.log('  - Request URL:', error.config?.url);
        console.log('  - API Key used:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'None');
        
        if (error.response?.status === 400) {
          errorMessage = 'Invalid image or parameters. Please check your image and try again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
          console.error('🔑 API Key issue detected. Check your VITE_STABILITY_API_KEY in .env file');
        } else if (error.response?.status === 402) {
          errorMessage = 'Insufficient credits on Stability AI account.';
          console.error('💳 Add credits to your Stability AI account at https://platform.stability.ai/');
        } else if (error.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait and try again.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try with a smaller image.';
        } else {
          errorMessage = `API Error (${error.response?.status}): ${error.response?.data?.message || error.message}`;
        }
      } else {
        console.error('🌐 Network or other error:', error.message);
      }

      onProgress?.({ progress: 0, status: 'failed', message: errorMessage });
      throw new Error(errorMessage);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Create a small test image to validate the API key
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('image', testFile);
      formData.append('prompt', 'test');
      formData.append('output_format', 'png');

      await axios.post(STABILITY_API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*',
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Helper method to convert blob to base64 for preview
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Helper method to estimate credit cost based on image dimensions and scale
  static estimateCreditCost(imageFile: File, scale: number): Promise<number> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const pixels = img.width * img.height;
        const scaledPixels = pixels * scale * scale;
        
        // Rough estimate: 1 credit per 1 megapixel of output
        const credits = Math.max(1, Math.ceil(scaledPixels / 1000000));
        resolve(credits);
      };
      img.onerror = () => resolve(1); // Default to 1 credit if we can't determine
      img.src = URL.createObjectURL(imageFile);
    });
  }
}

// Create a singleton instance
export const stabilityAI = new StabilityAIService(
  import.meta.env.VITE_STABILITY_API_KEY || ''
);