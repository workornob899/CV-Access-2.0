import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Only require Cloudinary credentials in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary environment variables are required in production: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'development',
  api_key: process.env.CLOUDINARY_API_KEY || 'development',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'development',
});

export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary
   * @param buffer File buffer
   * @param folder Folder name in Cloudinary
   * @param filename Original filename
   * @returns Promise<string> - The Cloudinary URL
   */
  async uploadFile(buffer: Buffer, folder: string, filename: string): Promise<string> {
    // In development without Cloudinary credentials, return a mock URL
    if (process.env.NODE_ENV !== 'production' && !process.env.CLOUDINARY_CLOUD_NAME) {
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/v1/${Date.now()}_${filename}`;
      console.log(`Development mode: Mock Cloudinary URL generated: ${mockUrl}`);
      return mockUrl;
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `ghotokbari/${folder}`,
          public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId Public ID of the file
   * @returns Promise<boolean>
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url Cloudinary URL
   * @returns string - Public ID
   */
  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}

export const cloudinaryService = new CloudinaryService();