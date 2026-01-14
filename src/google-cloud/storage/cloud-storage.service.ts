import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class CloudStorageService {
  private storage: Storage;
  private bucketName: string;
  private readonly logger = new Logger(CloudStorageService.name);

  // constructor(private configService: ConfigService) {
  //   this.storage = new Storage({
  //     projectId: this.configService.get('GOOGLE_CLOUD_PROJECT_ID') || '',
  //   });
  //   this.bucketName = this.configService.get('GOOGLE_CLOUD_BUCKET') || '';
  // }

  /**
   * Upload file to Cloud Storage
   */
  // async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // try {
    //   const bucket = this.storage.bucket(this.bucketName);
    //   const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    //   const fileUpload = bucket.file(fileName);

    //   await fileUpload.save(file.buffer, {
    //     metadata: {
    //       contentType: file.mimetype,
    //     },
    //   });

    //   // Make file publicly accessible
    //   await fileUpload.makePublic();

    //   const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

    //   this.logger.log(`File uploaded: ${publicUrl}`);
    //   return publicUrl;
    // } catch (error) {
    //   this.logger.error('Error uploading file to Cloud Storage', error);
    //   throw error;
    // }
  // }

  /**
   * Upload multiple files
   */
  // async uploadFiles(
  //   files: Express.Multer.File[],
  //   folder: string,
  // ): Promise<string[]> {
  //   const uploadPromises = files.map((file) => this.uploadFile(file, folder));
  //   return await Promise.all(uploadPromises);
  // }

  // /**
  //  * Delete file from Cloud Storage
  //  */
  // async deleteFile(fileName: string): Promise<void> {
  //   try {
  //     const bucket = this.storage.bucket(this.bucketName);
  //     await bucket.file(fileName).delete();
  //     this.logger.log(`File deleted: ${fileName}`);
  //   } catch (error) {
  //     this.logger.error('Error deleting file from Cloud Storage', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get signed URL for private file access
  //  */
  // async getSignedUrl(
  //   fileName: string,
  //   expiresInMinutes: number = 60,
  // ): Promise<string> {
  //   const bucket = this.storage.bucket(this.bucketName);
  //   const file = bucket.file(fileName);

  //   const [url] = await file.getSignedUrl({
  //     action: 'read',
  //     expires: Date.now() + expiresInMinutes * 60 * 1000,
  //   });

  //   return url;
  // }

  // /**
  //  * List files in a folder
  //  */
  // async listFiles(prefix: string): Promise<string[]> {
  //   const bucket = this.storage.bucket(this.bucketName);
  //   const [files] = await bucket.getFiles({ prefix });
  //   return files.map((file) => file.name);
  // }

  // /**
  //  * Check if file exists
  //  */
  // async fileExists(fileName: string): Promise<boolean> {
  //   const bucket = this.storage.bucket(this.bucketName);
  //   const file = bucket.file(fileName);
  //   const [exists] = await file.exists();
  //   return exists;
  // }
}
