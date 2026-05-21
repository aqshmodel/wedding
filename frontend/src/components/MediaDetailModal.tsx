import React, { useState, useEffect } from 'react';
import { X, Heart, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStorageUrl, API_URL } from '../utils/api';
import type { Media } from '../types';
import { getGuestUuid } from '../utils/storage';
import { Trash2 } from 'lucide-react';
import { useDeleteMedia } from '../hooks/useDeleteMedia';

interface MediaDetailModalProps {
  media: Media;
  onClose: () => void;
  onLikeChange: (mediaId: number, isLiked: boolean, newCount: number) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onDelete?: (mediaId: number) => void;
}

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ media, onClose, onLikeChange, hasPrev, hasNext, onNavigate, onDelete }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(media.is_liked || false);
  const [localLikesCount, setLocalLikesCount] = useState(media.likes_count || 0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { isDeleting, deleteMedia } = useDeleteMedia();
  const isMyPost = media.uploader_uuid === getGuestUuid();

  // mediaが変更されたらローカル状態をリセット
  useEffect(() => {
    setLocalIsLiked(media.is_liked || false);
    setLocalLikesCount(media.likes_count || 0);
  }, [media]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate) onNavigate('prev');
      if (e.key === 'ArrowRight' && hasNext && onNavigate) onNavigate('next');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onNavigate, onClose]);

  // スワイプ処理
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onNavigate && hasNext) onNavigate('next');
    if (isRightSwipe && onNavigate && hasPrev) onNavigate('prev');
  };

  const handleDownload = async () => {
    // オリジナル画像のURLを取得してダウンロード
    const response = await fetch(getStorageUrl(media.file_path!));
    if (!response.ok) throw new Error('Network error');
    const blob = await response.blob();
    const extension = media.type === 'video' ? 'mp4' : 'jpg'; // 簡易的な拡張子判定
    const filename = `wedding_${media.uploader_name}_${media.id}.${extension}`;
    
    // aタグを作成してダウンロード
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    // 楽観的UI更新
    const newIsLiked = !localIsLiked;
    const newCount = localIsLiked ? Math.max(0, localLikesCount - 1) : localLikesCount + 1;
    
    setLocalIsLiked(newIsLiked);
    setLocalLikesCount(newCount);
    onLikeChange(media.id, newIsLiked, newCount);

    try {
      const response = await fetch(`${API_URL}/media/${media.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          guest_uuid: getGuestUuid()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      
      const data = await response.json();
      // サーバーからの正確な値で更新
      setLocalIsLiked(data.liked);
      setLocalLikesCount(data.likes_count);
      onLikeChange(media.id, data.liked, data.likes_count);
    } catch (error) {
      console.error('Like error:', error);
      // エラー時は元に戻す
      setLocalIsLiked(media.is_liked || false);
      setLocalLikesCount(media.likes_count || 0);
      onLikeChange(media.id, media.is_liked || false, media.likes_count || 0);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const success = await deleteMedia(media.id);
    if (success) {
      if (onDelete) onDelete(media.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[110] flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
    >
      {/* Header */}
      <div className="flex justify-end p-4">
        <button 
          onClick={onClose}
          className="text-white/80 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      {/* Media Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
        {hasPrev && (
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('prev'); }}
            className="absolute left-4 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {media.type === 'video' ? (
          <video 
            key={media.file_path}
            src={getStorageUrl(media.file_path!)} 
            className="max-w-full max-h-full object-contain" 
            controls 
            autoPlay 
            playsInline
          />
        ) : (
          <img 
            key={media.file_path}
            src={getStorageUrl(media.file_path!)} 
            alt={media.message || "写真詳細"} 
            className="max-w-full max-h-full object-contain select-none"
          />
        )}

        {hasNext && (
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('next'); }}
            className="absolute right-4 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Info Bottom Bar */}
      <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white pb-safe">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg truncate">{media.uploader_name}</span>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  media.guest_side === 'groom' 
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' 
                    : 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                }`}>
                  {media.guest_side === 'groom' ? '新郎ゲスト' : '新婦ゲスト'}
                </span>
              </div>
              {media.message && (
                <p className="text-white/90 text-sm leading-relaxed mb-4 break-words">
                  {media.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`p-3 rounded-full transition-all duration-300 ${
                  localIsLiked 
                    ? 'bg-pink-500/20 text-pink-500 scale-110' 
                    : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:scale-105'
                }`}>
                  <Heart size={24} fill={localIsLiked ? "currentColor" : "none"} />
                </div>
                <span className="text-xs font-medium">{localLikesCount}</span>
              </button>

              <button 
                onClick={handleDownload}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
                  <Download size={24} />
                </div>
                <span className="text-xs font-medium">保存</span>
              </button>

              {isMyPost && (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-white/10 text-white/70 group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:scale-105 transition-all duration-300">
                    <Trash2 size={24} />
                  </div>
                  <span className="text-xs font-medium">削除</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Swipe Hint (Mobile Only) */}
          {(hasPrev || hasNext) && (
            <p className="text-[10px] text-white/40 text-center mt-4 md:hidden flex items-center justify-center gap-2">
              <ChevronLeft size={12} /> 左右にスワイプして切り替え <ChevronRight size={12} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaDetailModal;
