
import { Client as ObjectStorageClient } from "@replit/object-storage";
import fs from "fs";
import path from "path";

// Initialize Object Storage client
const objectStorage = new ObjectStorageClient();

export class FileStorageService {
  private client: ObjectStorageClient;

  constructor() {
    this.client = objectStorage;
  }

  /**
   * Upload a file to Object Storage
   * @param filePath Local file path
   * @param storageKey Key to store the file under
   * @returns Promise<string> - The Object Storage URL
   */
  async uploadFile(filePath: string, storageKey: string): Promise<string> {
    try {
      console.log(`Uploading file ${filePath} to Object Storage as ${storageKey}`);
      
      // Read file and upload to Object Storage
      const fileBuffer = fs.readFileSync(filePath);
      await this.client.uploadFromBytes(storageKey, fileBuffer);
      
      // Return the Object Storage URL
      const url = `/api/files/${storageKey}`;
      console.log(`File uploaded successfully: ${url}`);
      
      // Clean up local file after successful upload
      try {
        fs.unlinkSync(filePath);
        console.log(`Local file cleaned up: ${filePath}`);
      } catch (cleanupError) {
        console.warn(`Warning: Could not clean up local file ${filePath}:`, cleanupError);
      }
      
      return url;
    } catch (error) {
      console.error(`Failed to upload file ${filePath}:`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a file buffer to Object Storage
   * @param buffer File buffer
   * @param storageKey Key to store the file under
   * @returns Promise<string> - The Object Storage URL
   */
  async uploadFromBuffer(buffer: Buffer, storageKey: string): Promise<string> {
    try {
      console.log(`Uploading file buffer to Object Storage as ${storageKey}`);
      
      // Upload buffer to Object Storage
      await this.client.uploadFromBytes(storageKey, buffer);
      
      // Return the Object Storage URL
      const url = `/api/files/${storageKey}`;
      console.log(`File uploaded successfully: ${url}`);
      
      return url;
    } catch (error) {
      console.error(`Failed to upload file buffer:`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Download a file from Object Storage
   * @param storageKey Key of the file in Object Storage
   * @returns Promise<Buffer> - The file data
   */
  async downloadFile(storageKey: string): Promise<Buffer> {
    try {
      console.log(`Downloading file from Object Storage: ${storageKey}`);
      const fileData = await this.client.downloadAsBytes(storageKey);
      return Buffer.from(fileData);
    } catch (error) {
      console.error(`Failed to download file ${storageKey}:`, error);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in Object Storage
   * @param storageKey Key of the file
   * @returns Promise<boolean>
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      await this.client.downloadAsBytes(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a file from Object Storage
   * @param storageKey Key of the file
   * @returns Promise<boolean>
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      console.log(`Deleting file from Object Storage: ${storageKey}`);
      await this.client.delete(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${storageKey}:`, error);
      return false;
    }
  }

  /**
   * Generate a unique storage key for a file
   * @param originalName Original filename
   * @param type File type ('profile' or 'document')
   * @returns string - Unique storage key
   */
  generateStorageKey(originalName: string, type: 'profile' | 'document'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(originalName);
    return `${type}s/${timestamp}_${random}${extension}`;
  }
}

export const fileStorage = new FileStorageService();
