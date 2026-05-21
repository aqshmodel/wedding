import { useState } from 'react';
import type { Media } from '../types';

export const useBatchDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  // 引数の mediaList は後方互換性のため残す（MainViewから渡されるため）
  // @ts-ignore
  const handleBatchDownload = async (mediaList?: Media[]) => {
    setIsDownloading(true);
    try {
      // サーバーにZIP生成・URL発行をリクエスト
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://wedding.aqsh.co.jp/api'}/media/download-zip`);
      
      if (!response.ok) {
        throw new Error('サーバーエラーが発生しました');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        // ZIPファイルのURLに遷移してダウンロード開始
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'ZIPファイルの取得に失敗しました');
      }
      
    } catch (error: any) {
      console.error("Batch download failed", error);
      alert(error.message || '一括ダウンロードに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    handleBatchDownload
  };
};
