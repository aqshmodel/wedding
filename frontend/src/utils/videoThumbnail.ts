export const generateVideoThumbnail = async (videoFile: File): Promise<Blob | null> => {
  return new Promise((resolve) => {
    // タイムアウト設定（安全策として3秒で強制打ち切り）
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 3000);

    const video = document.createElement('video');
    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
      video.remove();
    };

    try {
      objectUrl = URL.createObjectURL(videoFile);
      
      // 自動再生ポリシー対策やiOS対策のプロパティ設定
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      video.crossOrigin = 'anonymous'; // セキュリティエラー対策
      video.src = objectUrl;

      video.onloadeddata = () => {
        // 黒画面やレンダリング遅延を避けるため、1秒目または動画の半分の短い方をシーク
        const targetTime = Math.min(1.0, video.duration / 2);
        // durationがNaNなどで取得できない場合のフォールバック
        video.currentTime = isNaN(targetTime) ? 0.5 : targetTime;
      };

      video.onseeked = () => {
        // シーク直後はブラウザ（特にiOS）でデコードが完了しておらず真っ黒になることがあるため、少し待機する
        setTimeout(() => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              clearTimeout(timeoutId);
              cleanup();
              resolve(null);
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              clearTimeout(timeoutId);
              cleanup();
              resolve(blob);
            }, 'image/jpeg', 0.8);
          } catch (error) {
            console.warn('Canvas drawing failed:', error);
            clearTimeout(timeoutId);
            cleanup();
            resolve(null);
          }
        }, 300); // 300msのレンダリング猶予を与える
      };

      video.onerror = () => {
        console.warn('Video loading failed for thumbnail extraction');
        clearTimeout(timeoutId);
        cleanup();
        resolve(null);
      };
      
      // 再生開始せずにデータを読み込む
      video.load();
      
    } catch (error) {
      console.warn('Thumbnail extraction failed:', error);
      clearTimeout(timeoutId);
      cleanup();
      resolve(null);
    }
  });
};
