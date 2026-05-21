import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api, { getStorageUrl } from '../utils/api';
import { getGuestUuid } from '../utils/storage';
import type { Media } from '../types';

interface SlideshowModalProps {
  initialMediaList: Media[];
  guestSideFilter: 'all' | 'groom' | 'bride' | 'mine';
  onClose: () => void;
}

const SlideshowModal: React.FC<SlideshowModalProps> = ({ initialMediaList, guestSideFilter, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaList, setMediaList] = useState<Media[]>(initialMediaList);
  const [isLoading, setIsLoading] = useState(true);

  // 全件取得する
  useEffect(() => {
    const fetchAllMedia = async () => {
      try {
        const guestUuid = getGuestUuid();
        const res = await api.get(`/media?guest_uuid=${guestUuid}&all=true`);
        const data = res.data.data ? res.data.data : res.data;
        if (Array.isArray(data)) {
          setMediaList(data);
        }
      } catch (e) {
        console.error("Failed to fetch all media for slideshow", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllMedia();
  }, []);
  
  // 表示対象を画像と動画のみ、かつフィルターに合致するものにする
  const slideTargets = mediaList.filter(m => {
    if (guestSideFilter === 'mine') {
      if (m.uploader_uuid !== getGuestUuid()) return false;
    } else if (guestSideFilter !== 'all') {
      if (m.guest_side !== guestSideFilter) return false;
    }
    return m.type === 'image' || m.type === 'video';
  });

  useEffect(() => {
    if (slideTargets.length === 0) return;

    // 4.5秒ごとに次のスライドへ
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slideTargets.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [slideTargets.length]);

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (slideTargets.length === 0) return null;

  const currentMedia = slideTargets[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-[120] flex items-center justify-center">
      {/* 閉じるボタン */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/50 hover:text-white z-[130] p-3 bg-black/40 rounded-full transition-colors"
      >
        <X size={32} />
      </button>

      {/* ローディング表示 */}
      {isLoading && slideTargets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 z-[125]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* スライド本体 */}
      <div 
        key={currentMedia.id} // keyを変更することでReactに別要素として認識させ、フェードインのアニメーションを発火させる
        className="w-full h-full relative flex items-center justify-center overflow-hidden animate-[fadeIn_1s_ease-in-out]"
      >
        {currentMedia.type === 'video' ? (
          <video 
            src={getStorageUrl(currentMedia.file_path!)}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            loop
          />
        ) : (
          <img 
            src={getStorageUrl(currentMedia.file_path!)}
            alt="Slideshow"
            className="w-full h-full object-contain select-none"
          />
        )}
        
        {/* キャプションエリア */}
        <div className="absolute bottom-12 left-12 right-12 md:right-auto md:max-w-xl text-white bg-black/60 p-6 rounded-2xl backdrop-blur-md animate-[slideUp_0.8s_ease-out]">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-bold text-2xl truncate">{currentMedia.uploader_name}</span>
            <span className={`text-sm px-3 py-1 rounded-full whitespace-nowrap border ${
              currentMedia.guest_side === 'groom' 
                ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' 
                : 'bg-pink-500/20 text-pink-200 border-pink-500/30'
            }`}>
              {currentMedia.guest_side === 'groom' ? '新郎ゲスト' : '新婦ゲスト'}
            </span>
          </div>
          {currentMedia.message && (
            <p className="text-white/90 text-lg leading-relaxed break-words line-clamp-3">
              {currentMedia.message}
            </p>
          )}
        </div>
      </div>
      
      {/* カスタムアニメーション用のstyle定義 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SlideshowModal;
