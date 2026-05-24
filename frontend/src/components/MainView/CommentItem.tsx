import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import type { Comment } from '../../types';
import api from '../../utils/api';
import { getGuestUuid } from '../../utils/storage';

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: number) => void;
  onLikeChange: (commentId: number, isLiked: boolean, newCount: number) => void;
  onReply: (comment: Comment) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete, onLikeChange, onReply, isReply = false }) => {
  const guestUuid = getGuestUuid();
  const [animatingLike, setAnimatingLike] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    const newIsLiked = !comment.is_liked;
    const newCount = comment.is_liked ? comment.likes_count - 1 : comment.likes_count + 1;
    
    onLikeChange(comment.id, newIsLiked, newCount);

    if (newIsLiked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 1000);
    }

    try {
      await api.post(`/comments/${comment.id}/like`, { guest_uuid: guestUuid });
    } catch (error) {
      console.error('Failed to toggle like on comment:', error);
      onLikeChange(comment.id, !newIsLiked, comment.likes_count);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('このコメントを削除してもよろしいですか？')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/comments/${comment.id}`, { data: { guest_uuid: guestUuid } });
      onDelete(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex items-start group ${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
      <div className={`flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 ${
        isReply ? 'w-6 h-6' : 'w-8 h-8'
      } ${comment.guest_side === 'groom' ? 'bg-blue-400' : 'bg-pink-400'}`}>
        {comment.guest_name.charAt(0)}
      </div>
      
      <div className="flex-grow">
        <div className="bg-gray-100 rounded-2xl px-3 py-2 text-sm">
          <span className="font-bold text-gray-900 mr-2">{comment.guest_name}</span>
          <span className="text-gray-800 whitespace-pre-wrap">{comment.message}</span>
        </div>
        
        <div className="flex items-center gap-4 mt-1 ml-2 text-xs font-semibold text-gray-500">
          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          {comment.likes_count > 0 && <span>{comment.likes_count} いいね</span>}
          {!isReply && (
            <button onClick={() => onReply(comment)} className="hover:text-gray-800 transition-colors">
              返信する
            </button>
          )}
          {comment.guest_uuid === guestUuid && (
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="hover:text-red-500 transition-colors"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <button 
        onClick={handleLike}
        className="ml-2 mt-2 relative p-1 focus:outline-none transition-transform active:scale-90"
      >
        <Heart 
          size={isReply ? 14 : 16} 
          className={`transition-colors ${
            comment.is_liked ? 'fill-pink-500 text-pink-500' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
        {animatingLike && (
          <Heart 
            size={isReply ? 24 : 26} 
            className="absolute inset-0 -top-1 -left-1 text-pink-500 fill-pink-500 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_forwards] opacity-0 pointer-events-none"
          />
        )}
      </button>
    </div>
  );
};

export default CommentItem;
