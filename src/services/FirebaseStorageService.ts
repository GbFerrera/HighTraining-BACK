import { bucket } from '../configs/firebase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadResult {
  downloadURL: string;
  filename: string;
  path: string;
}

class FirebaseStorageService {
  /**
   * Upload file to Firebase Storage
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
        ? `${userId}-${timestamp}-${uniqueId}${fileExtension}`
        : `${timestamp}-${uniqueId}${fileExtension}`;
      
      const filePath = `${folder}/${filename}`;
      
      // Create file reference in Firebase Storage
      const file = bucket.file(filePath);
      
      // Upload buffer to Firebase Storage
      await file.save(buffer, {
        metadata: {
          contentType: this.getMimeType(fileExtension),
        },
        public: true, // Make file publicly accessible
      });
      
      // Get public download URL
      const [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Far future date for permanent access
      });
      
      return {
        downloadURL,
        filename,
        path: filePath,
      };
    } catch (error) {
      console.error('Erro ao fazer upload para Firebase Storage:', error);
      throw new Error('Falha no upload da imagem');
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const file = bucket.file(filePath);
      await file.delete();
    } catch (error) {
      console.error('Erro ao deletar arquivo do Firebase Storage:', error);
      // Don't throw error if file doesn't exist
      if ((error as any).code !== 404) {
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
}

export default new FirebaseStorageService();
