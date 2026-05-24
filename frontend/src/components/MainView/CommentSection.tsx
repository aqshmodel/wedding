import React, { useState } from 'react';
import type { Comment } from '../../types';
import CommentItem from './CommentItem';
import api from '../../utils/api';
import { getGuestUuid, getGuestSide, getGuestName } from '../../utils/storage';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  batchId: string;
  initialComments?: Comment[];
}

const CommentSection: React.FC<CommentSectionProps> = ({ batchId, initialComments = [] }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setInputValue(`@${comment.guest_name} `);
    inputRef.current?.focus();
  };

  const handleLikeChange = (commentId: number, isLiked: boolean, newCount: number) => {
    const updateComment = (list: Comment[]): Comment[] => {
      return list.map(c => {
        if (c.id === commentId) {
          return { ...c, is_liked: isLiked, likes_count: newCount };
        }
        if (c.replies) {
          return { ...c, replies: updateComment(c.replies) };
        }
        return c;
      });
    };
    setComments(prev => updateComment(prev));
  };

  const handleDelete = (commentId: number) => {
    const removeComment = (list: Comment[]): Comment[] => {
      return list.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies ? removeComment(c.replies) : []
      }));
    };
    setComments(prev => removeComment(prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        batch_id: batchId,
        parent_id: replyingTo?.id || null,
        guest_uuid: getGuestUuid(),
        guest_name: getGuestName() || 'ゲスト',
        guest_side: getGuestSide() || 'groom',
        message: inputValue.trim()
      };

      const response = await api.post('/comments', payload);
      const newComment = response.data.data as Comment;

      if (replyingTo) {
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          return c;
        }));
      } else {
        setComments(prev => [...prev, newComment]);
      }

      setInputValue('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('コメントの送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 px-3 border-t border-gray-100 pt-3 pb-4">
      {/* Comments List */}
      <div className="mb-4">
        {comments.map(comment => (
          <div key={comment.id}>
            <CommentItem 
              comment={comment} 
              onDelete={handleDelete} 
              onLikeChange={handleLikeChange}
              onReply={handleReply}
            />
            {comment.replies && comment.replies.map(reply => (
              <CommentItem 
                key={reply.id}
                comment={reply}
                isReply
                onDelete={handleDelete}
                onLikeChange={handleLikeChange}
                onReply={() => {}} // ネストは1段階まで
              />
            ))}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 border-t border-gray-100 pt-3 relative">
        {replyingTo && (
          <div className="absolute -top-6 left-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center">
            <span>{replyingTo.guest_name} さんに返信中</span>
            <button 
              type="button" 
              onClick={() => { setReplyingTo(null); setInputValue(''); }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
          {(getGuestName() || 'ゲ').charAt(0)}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="コメントを追加..."
          className="flex-grow bg-transparent border-none text-base py-1 focus:ring-0 placeholder-gray-400 leading-normal"
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isSubmitting}
          className="text-blue-500 font-semibold disabled:text-gray-300 disabled:opacity-50 p-1 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
