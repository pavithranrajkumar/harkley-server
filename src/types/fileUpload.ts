// File upload service types
export interface UploadResult {
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}
