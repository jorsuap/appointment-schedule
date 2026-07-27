import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Uploads a base64 image to Cloudinary and returns the optimized URL.
 * Images are stored in the 'conalma/professionals' folder.
 */
export async function uploadProfileImage(
  base64Data: string,
  professionalId: string,
): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'conalma/professionals',
    public_id: `profile-${professionalId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}
