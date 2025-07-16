import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary with provided credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df2fkc7qv',
  api_key: process.env.CLOUDINARY_API_KEY || '228883882389618',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'j59xsUqHTO0Sfz5Q7E_u6pJ7RSc',
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
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `ghotokbari/${folder}`,
          public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log(`File uploaded to Cloudinary: ${result!.secure_url}`);
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