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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-tiffany-light/80 via-tiffany to-tiffany-dark p-4 relative overflow-hidden">
      {/* 装飾用の光のぼかし */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center text-gray-800 relative z-10 border border-white/50">
        <div className="w-20 h-20 bg-gradient-to-tr from-tiffany to-tiffany-light rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-tiffany/30">
          <Heart className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        
        <h1 className="text-3xl font-serif mb-2 tracking-wide text-gray-900">Takahiro & Yuri</h1>
        <p className="text-sm tracking-widest text-tiffany-dark font-medium uppercase mb-6">Happy Wedding</p>
        
        <p className="text-gray-500 mb-8 font-medium text-sm">どちらのゲストとして参加されていますか？</p>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect('groom')}
            className="w-full relative group overflow-hidden bg-white text-blue-600 border border-blue-100 p-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
          >
            <span className="absolute inset-0 bg-blue-50/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            <span className="relative z-10">新郎ゲスト</span>
          </button>
          
          <button
            onClick={() => handleSelect('bride')}
            className="w-full relative group overflow-hidden bg-white text-pink-600 border border-pink-100 p-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/10 active:scale-[0.98]"
          >
            <span className="absolute inset-0 bg-pink-50/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            <span className="relative z-10">新婦ゲスト</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
