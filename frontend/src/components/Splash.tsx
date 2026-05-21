import React, { useEffect } from 'react';
import { setGuestSide, getGuestUuid } from '../utils/storage';
import api, { getStorageUrl } from '../utils/api';
import { Heart } from 'lucide-react';

interface SplashProps {
  onSelectSide: (side: 'groom' | 'bride') => void;
}

const Splash: React.FC<SplashProps> = ({ onSelectSide }) => {
  useEffect(() => {
    // 画面表示時に裏側でメディアデータをフェッチ＆画像プリロード開始
    const uuid = getGuestUuid();
    api.get(`/media?guest_uuid=${uuid}&page=1`).then(res => {
      const data = res.data.data || res.data;
      if (Array.isArray(data)) {
        const images = data.filter((m: any) => m.type === 'image');
        images.slice(0, 10).forEach((media: any) => {
          const url = getStorageUrl(media.thumbnail_path || media.file_path);
          const img = new Image();
          img.src = url;
        });
      }
    }).catch(console.error);
  }, []);

  const handleSelect = (side: 'groom' | 'bride') => {
    setGuestSide(side);
    getGuestUuid(); // 初期アクセス時にUUIDを生成・保存
    onSelectSide(side);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tiffany p-4 text-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center text-gray-800">
        <Heart className="w-16 h-16 text-tiffany mx-auto mb-6" fill="#0abab5" />
        <h1 className="text-3xl font-serif mb-2">Welcome</h1>
        <p className="text-gray-500 mb-8 font-medium">どちらのゲストとして参加されていますか？</p>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect('groom')}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 p-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center shadow-sm"
          >
            新郎ゲスト
          </button>
          
          <button
            onClick={() => handleSelect('bride')}
            className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 p-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center shadow-sm"
          >
            新婦ゲスト
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
