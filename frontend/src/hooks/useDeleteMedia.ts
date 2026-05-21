import { useState } from 'react';
import { API_URL } from '../utils/api';
import { getGuestUuid } from '../utils/storage';

export const useDeleteMedia = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMedia = async (mediaId: number): Promise<boolean> => {
    const guestUuid = getGuestUuid();
    if (!guestUuid) {
      alert('ゲスト情報が見つかりません。');
      return false;
    }

    if (!window.confirm('この投稿を本当に削除しますか？\n削除すると元に戻せません。')) {
      return false;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ guest_uuid: guestUuid })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '削除に失敗しました。');
      }

      const data = await response.json();
      return data.success;
    } catch (error: any) {
      console.error('Failed to delete media:', error);
      alert(error.message || '削除処理中にエラーが発生しました。時間をおいて再度お試しください。');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    deleteMedia
  };
};
