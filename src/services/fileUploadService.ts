import { supabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { UploadResult, FileValidationResult } from '../types/fileUpload';

export class FileUploadService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = ['video/webm', 'audio/webm'];
  private readonly BUCKET_NAME = 'meeting-recordings';

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type. Only WebM files are allowed.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Generate secure file path
   */
  private generateFilePath(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const fileId = uuidv4();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;

    // Structure: users/{userId}/meetings/{timestamp}_{fileName}
    return `users/${userId}/meetings/${timestamp}_${fileName}`;
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate secure file path
    const filePath = this.generateFilePath(userId, file.originalname);

    // Upload to Supabase storage
    const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false, // Prevent overwriting existing files
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath, {});

    return {
      fileUrl: urlData.publicUrl,
      filePath: filePath,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Generate signed URL for secure access
   */
  async generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(this.BUCKET_NAME).createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    const { data, error } = await supabase.storage.from(this.BUCKET_NAME).list(path.dirname(filePath), {
      limit: 1000,
      offset: 0,
      search: path.basename(filePath),
    });

    if (error) {
      throw new Error(`Failed to check file existence: ${error.message}`);
    }

    return data.some((file) => file.name === path.basename(filePath));
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{
    size: number;
    mimeType: string;
    lastModified: string;
  } | null> {
    const { data, error } = await supabase.storage.from(this.BUCKET_NAME).list(path.dirname(filePath), {
      limit: 1000,
      offset: 0,
      search: path.basename(filePath),
    });

    if (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }

    const file = data.find((f) => f.name === path.basename(filePath));
    if (!file) {
      return null;
    }

    return {
      size: file.metadata?.size || 0,
      mimeType: file.metadata?.mimetype || 'unknown',
      lastModified: file.updated_at || new Date().toISOString(),
    };
  }
}
