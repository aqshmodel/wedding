import React, { useMemo, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import type { Media } from '../../types';
import { getStorageUrl } from '../../utils/api';
import api from '../../utils/api';
import { getGuestUuid } from '../../utils/storage';
import { useDeleteMedia } from '../../hooks/useDeleteMedia';

interface MessageListProps {
  mediaList: Media[];
  onLikeChange: (mediaId: number, isLiked: boolean, newCount: number) => void;
  onDelete?: (mediaId: number) => void;
}

interface FeedPost {
  id: string; // 代表となる一意のID
  uploader_name: string;
  uploader_uuid: string;
  guest_side: 'groom' | 'bride';
  message: string;
  mediaItems: Media[]; // グループ化されたメディア
  primaryMedia: Media; // 代表メディア（1枚目）いいねの基準に使用
}

const MessageList: React.FC<MessageListProps> = ({ mediaList, onLikeChange, onDelete }) => {
  const guestUuid = getGuestUuid();
  const { isDeleting, deleteMedia } = useDeleteMedia();

  // 1. メッセージがある投稿のみをフィルタリング
  const messagesOnly = mediaList.filter(m => !!m.message);

  // 2. 連続する同じユーザー・同じメッセージをグルーピング
  const feedPosts = useMemo(() => {
    const posts: FeedPost[] = [];
    if (messagesOnly.length === 0) return posts;

    let currentGroup: FeedPost | null = null;

    messagesOnly.forEach((media) => {
      // 直前の投稿と同じユーザー＆同じメッセージならまとめる
      if (
        currentGroup &&
        currentGroup.uploader_uuid === media.uploader_uuid &&
        currentGroup.message === media.message
      ) {
        currentGroup.mediaItems.push(media);
      } else {
        // 新しいグループを作成
        currentGroup = {
          id: `feed_${media.id}`,
          uploader_name: media.uploader_name,
          uploader_uuid: media.uploader_uuid,
          guest_side: media.guest_side,
          message: media.message!,
          mediaItems: [media],
          primaryMedia: media,
        };
        posts.push(currentGroup);
      }
    });

    return posts;
  }, [messagesOnly]);

  const [animatingLikeId, setAnimatingLikeId] = useState<number | null>(null);

  // 代表メディアに対して「いいね」を送信する
  const handleLike = async (post: FeedPost) => {
    const media = post.primaryMedia;
    const newIsLiked = !media.is_liked;
    const newCount = media.is_liked ? media.likes_count - 1 : media.likes_count + 1;
    
    // UIを先に更新（Optimistic Update）
    onLikeChange(media.id, newIsLiked, newCount);

    if (newIsLiked) {
      setAnimatingLikeId(media.id);
      setTimeout(() => setAnimatingLikeId(null), 1000);
    }

    try {
      await api.post(`/media/${media.id}/like`);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // エラー時は元に戻す
      onLikeChange(media.id, !newIsLiked, media.likes_count);
    }
  };

  const handleDelete = async (post: FeedPost) => {
    if (isDeleting) return;
    const success = await deleteMedia(post.primaryMedia.id);
    if (success && onDelete) {
      // グループ化されている全てのメディアをローカルstateから削除する
      post.mediaItems.forEach(m => onDelete(m.id));
    }
  };

  if (feedPosts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p className="mb-2">まだメッセージはありません</p>
        <p className="text-sm">アップロード時にメッセージを添えると<br/>ここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <div className="w-full mx-auto space-y-6 sm:py-6">
        {feedPosts.map((post) => {
          // メディアがあるかどうか（メッセージのみの投稿もある）
          const hasMedia = post.mediaItems.some(m => m.type === 'image' || m.type === 'video');

          return (
            <article key={post.id} className="bg-white border-y border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${
                  post.guest_side === 'groom' ? 'bg-blue-400' : 'bg-pink-400'
                }`}>
                  {post.uploader_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 leading-none">{post.uploader_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.guest_side === 'groom' ? '新郎側ゲスト' : '新婦側ゲスト'}
                  </p>
                </div>
              </div>

              {/* Media Carousel */}
              {hasMedia && (
                <div className="relative w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                  {post.mediaItems.map((media, index) => {
                    // メッセージのみのtypeは除外してメディアだけ表示
                    if (media.type === 'message') return null;

                    return (
                      <div key={media.id} className="w-full flex-shrink-0 snap-center relative flex items-center justify-center bg-white">
                        {media.type === 'video' ? (
                          <>
                            <video
                              src={getStorageUrl(media.file_path!)}
                              className="w-full h-auto max-h-[85vh] object-contain"
                              controls
                              preload="metadata"
                            />
                            {/* Native controls over video, but optional indicator if needed */}
                          </>
                        ) : (
                          <img
                            src={getStorageUrl(media.thumbnail_path || media.file_path!)}
                            alt={`Photo by ${post.uploader_name}`}
                            className="w-full h-auto max-h-[85vh] object-contain"
                            loading="lazy"
                          />
                        )}
                        {/* Pagination Indicators for Multiple Images */}
                        {post.mediaItems.filter(m => m.type !== 'message').length > 1 && (
                          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10">
                            {index + 1} / {post.mediaItems.filter(m => m.type !== 'message').length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions & Message */}
              <div className="px-3 py-2">
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleLike(post)}
                      className="group relative focus:outline-none transition-transform active:scale-90 mr-2"
                    >
                      <Heart 
                        size={26} 
                        className={`transition-colors ${
                          post.primaryMedia.is_liked ? 'fill-pink-500 text-pink-500' : 'text-gray-800 group-hover:text-gray-500'
                        }`}
                      />
                      {animatingLikeId === post.primaryMedia.id && (
                        <Heart 
                          size={36} 
                          className="absolute inset-0 -top-1 -left-1 text-pink-500 fill-pink-500 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_forwards] opacity-0 pointer-events-none"
                        />
                      )}
                    </button>
                    <span className="font-bold text-sm text-gray-900">
                      {post.primaryMedia.likes_count}件の「いいね」
                    </span>
                  </div>

                  {post.uploader_uuid === guestUuid && (
                    <button
                      onClick={() => handleDelete(post)}
                      disabled={isDeleting}
                      className="ml-auto flex items-center text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                      title="削除"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div className="text-sm leading-snug">
                  <span className="font-bold text-gray-900 mr-2">{post.uploader_name}</span>
                  <span className="text-gray-800 whitespace-pre-wrap">{post.message}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <style>{`
        /* スクロールバーを隠すユーティリティ */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MessageList;
