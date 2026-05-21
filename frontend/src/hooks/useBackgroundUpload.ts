import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getGuestUuid, getGuestSide } from '../utils/storage';

export interface UploadQueueItem {
  files: File[];
  name: string;
  message: string;
  progress: number;
  total: number;
  currentIndex: number;
  isUploading: boolean;
  status: 'idle' | 'uploading' | 'completed' | 'error';
}

export const useBackgroundUpload = (onComplete: () => void) => {
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem | null>(null);
  const isPacingRef = useRef(false);

  useEffect(() => {
    if (!uploadQueue || uploadQueue.status !== 'uploading' || isPacingRef.current) return;

    if (uploadQueue.currentIndex >= uploadQueue.total) {
      setUploadQueue(prev => prev ? { ...prev, status: 'completed' } : null);
      onComplete();
      setTimeout(() => setUploadQueue(null), 3000);
      return;
    }

    const processNext = async () => {
      isPacingRef.current = true;
      const file = uploadQueue.files[uploadQueue.currentIndex];
      
      try {
        if (!file && uploadQueue.total === 1 && uploadQueue.message) {
          const formData = new FormData();
          formData.append('uploader_name', uploadQueue.name);
          formData.append('message', uploadQueue.message);
          formData.append('uploader_uuid', getGuestUuid());
          formData.append('guest_side', getGuestSide() || 'groom');
          formData.append('type', 'message');
          await api.post('/media', formData);
        } else if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('uploader_name', uploadQueue.name);
          formData.append('message', uploadQueue.message);
          formData.append('uploader_uuid', getGuestUuid());
          formData.append('guest_side', getGuestSide() || 'groom');
          formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');
          await api.post('/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } catch (err) {
        console.error('Background upload error', err);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadQueue(prev => {
        if (!prev) return null;
        const nextIndex = prev.currentIndex + 1;
        return {
          ...prev,
          currentIndex: nextIndex,
          progress: Math.round((nextIndex / prev.total) * 100)
        };
      });
      
      isPacingRef.current = false;
    };

    processNext();
  }, [uploadQueue, uploadQueue?.currentIndex, uploadQueue?.status, onComplete]);

  return {
    uploadQueue,
    setUploadQueue
  };
};
