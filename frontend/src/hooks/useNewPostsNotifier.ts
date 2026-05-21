import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export const useNewPostsNotifier = (currentTotalPosts: number) => {
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const etagRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 最初の投稿数が0なら通知は出さない
    if (currentTotalPosts === 0) return;

    let pollInterval = 15000; // 初期15秒
    let isChecking = false;
    let isFirstCheck = etagRef.current === null; // 初回はEtagがないので通知を出さずに覚えるだけにする

    const checkUpdates = async () => {
      if (isChecking) return;
      if (document.visibilityState !== 'visible') {
        // バックグラウンド時はチェックしない
        return;
      }
      isChecking = true;

      try {
        const headers: Record<string, string> = {};
        if (etagRef.current) {
          headers['If-None-Match'] = etagRef.current;
        }

        const res = await api.get('/media/latest-id', { headers, validateStatus: (status) => status >= 200 && status < 400 });

        if (res.status === 304) {
          // 変更なし
          pollInterval = Math.min(pollInterval + 5000, 60000); // 変更がなければ徐々に間隔を延ばす(最大1分)
        } else if (res.status === 200) {
          // 変更あり
          etagRef.current = res.headers['etag'] || null;
          
          if (!isFirstCheck) {
            setHasNewPosts(true);
          }
          
          isFirstCheck = false;
          pollInterval = 15000; // リセット
        }
      } catch (error) {
        console.error('Failed to check updates', error);
      } finally {
        isChecking = false;
        timerRef.current = setTimeout(checkUpdates, pollInterval);
      }
    };

    timerRef.current = setTimeout(checkUpdates, pollInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentTotalPosts]);

  const resetNotifier = () => {
    setHasNewPosts(false);
  };

  // 一覧をリロードした際などにETagをクリアして、次のポーリングで再同期させる
  const syncEtag = () => {
    etagRef.current = null;
    setHasNewPosts(false);
  };

  return { hasNewPosts, resetNotifier, syncEtag };
};
