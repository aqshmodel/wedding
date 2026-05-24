import api from './api';

interface ChunkUploadOptions {
  file: File;
  thumbnailFile?: File;
  sessionId: string;
  uploaderName: string;
  uploaderUuid: string;
  guestSide: string;
  message?: string;
  chunkSize?: number; // default 5MB
  maxRetries?: number; // default 3
  batchId?: string;
}

export class ChunkUploader {
  private file: File;
  private thumbnailFile?: File;
  private sessionId: string;
  private uploaderName: string;
  private uploaderUuid: string;
  private guestSide: string;
  private message?: string;
  private chunkSize: number;
  private maxRetries: number;
  private batchId?: string;

  constructor(options: ChunkUploadOptions) {
    this.file = options.file;
    this.thumbnailFile = options.thumbnailFile;
    this.sessionId = options.sessionId;
    this.uploaderName = options.uploaderName;
    this.uploaderUuid = options.uploaderUuid;
    this.guestSide = options.guestSide;
    this.message = options.message;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB
    this.maxRetries = options.maxRetries || 3;
    this.batchId = options.batchId;
  }

  /**
   * チャンクごとのアップロードを実行する
   */
  public async upload(): Promise<any> {
    const totalChunks = Math.ceil(this.file.size / this.chunkSize);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunk = this.file.slice(start, end);
      const isFinal = chunkIndex === totalChunks - 1;

      await this.uploadChunkWithRetry(chunk, chunkIndex, totalChunks, isFinal);
    }

    return { success: true, message: 'Chunk upload complete' };
  }

  /**
   * 個々のチャンクをアップロードし、失敗した場合はリトライする
   */
  private async uploadChunkWithRetry(
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    retryCount = 0
  ): Promise<void> {
    const formData = new FormData();
    formData.append('session_id', this.sessionId);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('is_final', isFinal ? 'true' : 'false');
    
    // BlobからFileに変換して送信する（バックエンドのバリデーション回避用）
    const chunkFile = new File([chunk], 'chunk.part', { type: 'application/octet-stream' });
    formData.append('file', chunkFile);

    if (isFinal) {
      formData.append('original_name', this.file.name);
      formData.append('mime_type', this.file.type);
      formData.append('uploader_name', this.uploaderName);
      formData.append('uploader_uuid', this.uploaderUuid);
      formData.append('guest_side', this.guestSide);
      if (this.message) formData.append('message', this.message);
      if (this.thumbnailFile) formData.append('thumbnail_file', this.thumbnailFile);
      if (this.batchId) formData.append('batch_id', this.batchId);
    }

    try {
      await api.post('/media/chunk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // チャンク送信は少し長めにタイムアウトを設定
      });
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`Chunk ${chunkIndex} failed. Retrying... (${retryCount + 1}/${this.maxRetries})`);
        // エクスポネンシャルバックオフ (1s, 2s, 4s...)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadChunkWithRetry(chunk, chunkIndex, totalChunks, isFinal, retryCount + 1);
      }
      throw new Error(`Failed to upload chunk ${chunkIndex} after ${this.maxRetries} retries.`);
    }
  }
}
