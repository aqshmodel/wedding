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
        className={`bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-tiffany p-5 text-white text-center relative shrink-0">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">Takahiro & Yuri Wedding</h2>
        </div>

        <div className="p-5 space-y-5 text-gray-700 overflow-y-auto">
          <p className="text-center font-medium text-sm sm:text-base">
            本日はご参加ありがとうございます！<br />
            皆さまが撮ってくれた写真や動画を<br />
            ぜひここでシェアしてください✨
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-tiffany/10 p-2 rounded-full text-tiffany shrink-0 mt-0.5">
                <PlusCircle size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">投稿は右下の「＋」ボタンから</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  写真や動画はもちろん、お祝いのメッセージだけの投稿も大歓迎です！
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-pink-100 p-2 rounded-full text-pink-500 shrink-0 mt-0.5">
                <Heart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">いいね＆ダウンロード</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  素敵な写真には「いいね」を押したり、自分のスマホに保存（ダウンロード）することができます。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 sm:p-4 rounded-xl text-[11px] sm:text-xs text-gray-500 space-y-1.5 border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">【 お願い 】</p>
            <p>・他のゲストの方が写っている写真を個人のSNS等へ無断転載することはお控えください。</p>
            <p>・アップロードされた写真は、後日新郎新婦が大切に保存させていただきます。</p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-tiffany hover:bg-tiffany-dark text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-tiffany/30 active:scale-95 shrink-0 mt-4"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
