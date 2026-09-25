import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: this.configService.get('R2_ENDPOINT'),
      region: this.configService.get('R2_REGION', 'auto'),
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get('R2_SECRET_KEY', ''),
      },
    });
    this.bucket = this.configService.get('R2_BUCKET', 'asanyaz-files');
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string, prefix = 'files'): Promise<{
    key: string;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    const ext = originalName.split('.').pop();
    const key = `${prefix}/${uuidv4()}.${ext}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return {
      key,
      fileName: originalName,
      mimeType,
      size: buffer.length,
    };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async getBuffer(key: string): Promise<Buffer> {
    const response = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));

    const stream = response.Body as any;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
