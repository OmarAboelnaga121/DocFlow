import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

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

  async uploadAvatar(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
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
