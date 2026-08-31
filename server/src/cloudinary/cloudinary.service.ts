import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  getDefaultAvatarUrl(identifier: string = 'User'): string {
    const encoded = encodeURIComponent(identifier.trim() || 'User');
    return `https://ui-avatars.com/api/?name=${encoded}&background=10b981&color=060e20&bold=true`;
  }

  async uploadAvatar(
    file?: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, GIF.`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Avatar file size exceeds the 2MB limit.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'docflow/avatars',
          transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(error);
          }
          resolve(result!);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicIdOrUrl: string): Promise<any> {
    try {
      let publicId = publicIdOrUrl;
      if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
        const splitUrl = publicIdOrUrl.split('/upload/');
        if (splitUrl.length > 1) {
          const pathAfterUpload = splitUrl[1];
          const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
          publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')) || withoutVersion;
        }
      }
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Failed to delete image from Cloudinary: ${publicIdOrUrl}`, error);
    }
  }
}
