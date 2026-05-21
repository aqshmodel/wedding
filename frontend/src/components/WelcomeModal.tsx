import React, { useEffect, useState } from 'react';
import { X, Camera, Heart, PlusCircle } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // アニメーション用
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // アニメーション終了後に完全にアンマウント
  };

  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-colors duration-300 ${
        isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div 
        className={`bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-tiffany p-6 text-white text-center relative">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Welcome!</h2>
          <p className="text-tiffany-light text-sm">Takahiro & Yuri Wedding</p>
        </div>

        <div className="p-6 space-y-6 text-gray-700">
          <p className="text-center font-medium">
            本日はご参加ありがとうございます！<br />
            皆さまが撮ってくれた写真や動画を<br />
            ぜひここでシェアしてください✨
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full text-blue-500 shrink-0 mt-1">
                <PlusCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">投稿は右下の「＋」ボタンから</h3>
                <p className="text-sm text-gray-600 mt-1">
                  写真や動画はもちろん、お祝いのメッセージだけの投稿も大歓迎です！
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-pink-100 p-2 rounded-full text-pink-500 shrink-0 mt-1">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">いいね＆ダウンロード</h3>
                <p className="text-sm text-gray-600 mt-1">
                  素敵な写真には「いいね」を押したり、自分のスマホに保存（ダウンロード）することができます。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 space-y-2 border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">【 お願い 】</p>
            <p>・他のゲストの方が写っている写真を個人のSNS等へ無断転載することはお控えください。</p>
            <p>・アップロードされた写真は、後日新郎新婦が大切に保存させていただきます。</p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-tiffany hover:bg-tiffany-dark text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-tiffany/30 active:scale-95"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
