import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getStorageUrl } from '../utils/api';
import type { Media } from '../types';

export const useBatchDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBatchDownload = async (mediaList: Media[]) => {
    const targets = mediaList.filter(m => m.type === 'image');
    if (targets.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder("wedding_photos");

      const downloadPromises = targets.map(async (media) => {
        try {
          const response = await fetch(getStorageUrl(media.file_path!));
          if (!response.ok) throw new Error('Network error');
          const blob = await response.blob();
          imagesFolder?.file(`${media.uploader_name}_${media.id}.jpg`, blob);
        } catch (e) {
          console.error(`Failed to download ${media.file_path}`, e);
        }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "wedding_photos.zip");
    } catch (error) {
      console.error("Batch download failed", error);
      alert('一括ダウンロードに失敗しました。');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    handleBatchDownload
  };
};
