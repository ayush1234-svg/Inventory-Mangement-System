import { apiRequest } from './api.js';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a compressed base64 data URL to the backend upload endpoint.
 * Returns the relative served URL (e.g. /uploads/product_1739884920_a1b2c3d4.webp).
 */
export async function uploadImage(dataUrl: string, filename?: string): Promise<string> {
  const response = await apiRequest<{ success: boolean; data: UploadResponse }>('/upload', {
    method: 'POST',
    body: JSON.stringify({
      image: dataUrl,
      filename,
    }),
  });

  return response.data.url;
}
