import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

type StoreImageInput = {
  folder: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
};

type StoredImage = {
  storagePath: string;
  publicUrl: string;
};

@Injectable()
export class FileStorageService {
  private readonly storageDriver: 'local' | 'gcs';
  private readonly localRoot: string;
  private readonly apiPublicBaseUrl: string;
  private readonly gcsBucketName: string | null;
  private readonly gcsPublicBaseUrl: string | null;
  private readonly storageClient: Storage | null;

  constructor(private readonly configService: ConfigService) {
    this.storageDriver = this.resolveStorageDriver();
    this.localRoot = path.resolve(
      process.cwd(),
      this.configService.get('FILE_STORAGE_LOCAL_DIR', 'uploads'),
    );
    this.apiPublicBaseUrl = this.resolveApiPublicBaseUrl();
    this.gcsBucketName = this.configService.get<string>('GCS_BUCKET_NAME')?.trim() || null;
    const configuredGcsPublicBaseUrl = this.configService
      .get<string>('GCS_PUBLIC_BASE_URL')
      ?.trim();
    this.gcsPublicBaseUrl =
      configuredGcsPublicBaseUrl?.replace(/\/+$/, '') || null;
    this.storageClient = this.storageDriver === 'gcs' ? new Storage() : null;
  }

  async storeImage(input: StoreImageInput): Promise<StoredImage> {
    const sanitizedFilename = this.buildStoredFilename(input.originalFilename);
    const storagePath = this.buildStoragePath(input.folder, sanitizedFilename);

    if (this.storageDriver === 'gcs') {
      return this.storeInGcs(storagePath, input);
    }

    return this.storeLocally(storagePath, input.buffer);
  }

  async deleteByPublicUrl(publicUrl?: string | null): Promise<void> {
    const storagePath = this.extractStoragePath(publicUrl);
    if (!storagePath) {
      return;
    }

    try {
      if (this.storageDriver === 'gcs') {
        if (!this.gcsBucketName || !this.storageClient) {
          return;
        }

        await this.storageClient
          .bucket(this.gcsBucketName)
          .file(storagePath)
          .delete({ ignoreNotFound: true });
        return;
      }

      await fs.rm(path.join(this.localRoot, storagePath), { force: true });
    } catch {
      // Image cleanup is best-effort so the main update path does not fail.
    }
  }

  private resolveStorageDriver(): 'local' | 'gcs' {
    const configuredDriver = this.configService
      .get('FILE_STORAGE_DRIVER', 'local')
      .trim()
      .toLowerCase();

    return configuredDriver === 'gcs' ? 'gcs' : 'local';
  }

  private resolveApiPublicBaseUrl(): string {
    const configuredBaseUrl = this.configService.get<string>('API_PUBLIC_BASE_URL')?.trim();
    if (configuredBaseUrl) {
      return configuredBaseUrl.replace(/\/+$/, '');
    }

    const port = this.configService.get('PORT', '8080');
    return `http://localhost:${port}`;
  }

  private buildStoredFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename).toLowerCase() || '.jpg';
    const baseName = path
      .basename(originalFilename, extension)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image';

    return `${Date.now()}-${baseName}${extension}`;
  }

  private buildStoragePath(folder: string, filename: string): string {
    return [folder, filename]
      .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  private async storeInGcs(
    storagePath: string,
    input: StoreImageInput,
  ): Promise<StoredImage> {
    if (!this.gcsBucketName || !this.storageClient) {
      throw new InternalServerErrorException(
        'GCS_BUCKET_NAME must be configured when FILE_STORAGE_DRIVER is gcs',
      );
    }

    const bucket = this.storageClient.bucket(this.gcsBucketName);
    const file = bucket.file(storagePath);

    await file.save(input.buffer, {
      resumable: false,
      metadata: {
        contentType: input.mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return {
      storagePath,
      publicUrl: this.buildGcsPublicUrl(storagePath),
    };
  }

  private async storeLocally(
    storagePath: string,
    buffer: Buffer,
  ): Promise<StoredImage> {
    const absolutePath = path.join(this.localRoot, storagePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    return {
      storagePath,
      publicUrl: `${this.apiPublicBaseUrl}/api/uploads/${this.encodeStoragePath(storagePath)}`,
    };
  }

  private buildGcsPublicUrl(storagePath: string): string {
    if (this.gcsPublicBaseUrl) {
      return `${this.gcsPublicBaseUrl}/${this.encodeStoragePath(storagePath)}`;
    }

    return `https://storage.googleapis.com/${this.gcsBucketName}/${this.encodeStoragePath(storagePath)}`;
  }

  private encodeStoragePath(storagePath: string): string {
    return storagePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  private extractStoragePath(publicUrl?: string | null): string | null {
    if (!publicUrl) {
      return null;
    }

    if (this.storageDriver === 'gcs') {
      if (this.gcsPublicBaseUrl && publicUrl.startsWith(this.gcsPublicBaseUrl)) {
        return this.decodeStoragePath(publicUrl.slice(this.gcsPublicBaseUrl.length + 1));
      }

      if (this.gcsBucketName) {
        const defaultPrefix = `https://storage.googleapis.com/${this.gcsBucketName}/`;
        if (publicUrl.startsWith(defaultPrefix)) {
          return this.decodeStoragePath(publicUrl.slice(defaultPrefix.length));
        }
      }

      return null;
    }

    const uploadsMarker = '/api/uploads/';
    const markerIndex = publicUrl.indexOf(uploadsMarker);
    if (markerIndex < 0) {
      return null;
    }

    return this.decodeStoragePath(publicUrl.slice(markerIndex + uploadsMarker.length));
  }

  private decodeStoragePath(value: string): string {
    return value
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  }
}
