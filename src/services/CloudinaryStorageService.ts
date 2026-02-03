import cloudinary from '../configs/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadResult {
  downloadURL: string;
  filename: string;
  path: string;
  publicId: string;
}

class CloudinaryStorageService {
  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: string,
    userId?: number
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalName);
      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const filename = userId 
        ? `${userId}-${timestamp}-${uniqueId}`
        : `${timestamp}-${uniqueId}`;
      
      const publicId = `${folder}/${filename}`;
      
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Buffer de imagem vazio ou inválido');
      }

      // Upload buffer to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(buffer);
      });
      
      return {
        downloadURL: uploadResult.secure_url,
        filename: filename + fileExtension,
        path: publicId,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      console.error('Erro ao fazer upload para Cloudinary:', error);
      throw new Error('Falha no upload da imagem');
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Erro ao deletar arquivo do Cloudinary:', error);
      // Don't throw error if file doesn't exist
      if ((error as any).http_code !== 404) {
        throw error;
      }
    }
  }

  /**
   * Upload student profile photo
   */
  async uploadStudentProfilePhoto(buffer: Buffer, originalName: string, studentId: number): Promise<UploadResult> {
    return this.uploadFile(buffer, originalName, 'student-profile-photos', studentId);
  }

  /**
   * Upload trainer profile photo
   */
  async uploadTrainerProfilePhoto(buffer: Buffer, originalName: string, trainerId: number): Promise<UploadResult> {
    return this.uploadFile(buffer, originalName, 'trainer-profile-photos', trainerId);
  }

  /**
   * Upload student progress photos
   */
  async uploadStudentProgressPhoto(buffer: Buffer, originalName: string, studentId: number): Promise<UploadResult> {
    return this.uploadFile(buffer, originalName, 'student-progress-photos', studentId);
  }

  /**
   * Upload feedback photos
   */
  async uploadFeedbackPhoto(buffer: Buffer, originalName: string, feedbackId: number): Promise<UploadResult> {
    return this.uploadFile(buffer, originalName, 'feedback-photos', feedbackId);
  }

  /**
   * Upload timeline photos
   */
  async uploadTimelinePhoto(buffer: Buffer, originalName: string, userId: number): Promise<UploadResult> {
    return this.uploadFile(buffer, originalName, 'timeline-photos', userId);
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }): string {
    const transformations = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.crop) transformations.push(`c_${options.crop}`);
    if (options?.quality) transformations.push(`q_${options.quality}`);
    
    transformations.push('f_auto'); // Auto format
    
    return cloudinary.url(publicId, {
      transformation: transformations.join(',')
    });
  }
}

export default new CloudinaryStorageService();
