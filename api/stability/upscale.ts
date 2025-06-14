// API route for Stability AI image upscaling
// This can be deployed as a Vercel API route or Netlify function

import { StabilityAIService } from '../../src/services/stabilityAI';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { image, scale, format, userId } = req.body;

    if (!image || !scale || !userId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Verify user has sufficient credits (check with Supabase)
    // This would typically involve checking the user's credit balance
    
    const stabilityAPI = new StabilityAIService(process.env.STABILITY_API_KEY || '');
    
    // Convert base64 image to file
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });
    
    const upscaledBlob = await stabilityAPI.upscaleImage(imageFile, {
      scale,
      format: format || 'png'
    });

    // Convert blob to base64 for response
    const buffer = await upscaledBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${upscaledBlob.type};base64,${base64}`;

    // Update user credits in Supabase
    // This would typically involve deducting credits from the user's account

    res.status(200).json({
      success: true,
      image: dataUrl,
      format: upscaledBlob.type,
      scale: scale
    });

  } catch (error) {
    console.error('Error upscaling image:', error);
    res.status(500).json({
      error: 'Failed to upscale image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}