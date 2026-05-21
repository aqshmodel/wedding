import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export const useNewPostsNotifier = (currentTotalPosts: number) => {
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const etagRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 最初の投稿数が0なら通知は出さない
    if (currentTotalPosts === 0) return;

    let pollInterval = 15000; // 初期15秒
    let isChecking = false;

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
          // ここで最新の総数がフロントで持っているものより多ければ通知
          // （※今回はlatest_media_idを返す設計にしたため、単に新しいEtagが来たら新着とみなす）
          setHasNewPosts(true);
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

  return { hasNewPosts, resetNotifier };
};
