import React, { useState, useEffect } from 'react';
import { Download, Loader2, Play } from 'lucide-react';
import api from '../../utils/api';

interface HeaderProfileProps {
  mediaCount: number;
  totalLikes: number;
  isDownloading: boolean;
  isMediaEmpty: boolean;
  onBatchDownload: () => void;
  onOpenSlideshow: () => void;
}

const HeaderProfile: React.FC<HeaderProfileProps> = ({
  mediaCount,
  totalLikes,
  isDownloading,
  isMediaEmpty,
  onBatchDownload,
  onOpenSlideshow
}) => {
  const [openingVisible, setOpeningVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        setOpeningVisible(res.data.opening_movie_visible);
        setProfileVisible(res.data.profile_movie_visible);
      })
      .catch(err => console.error('Failed to fetch settings', err));
  }, []);

  return (
    <div className="pt-8 px-4 pb-4 border-b border-gray-200">
      <div className="flex items-center space-x-6 mb-6">
        <div className="w-24 h-24 rounded-full bg-tiffany-light flex-shrink-0 overflow-hidden border-2 border-tiffany">
          <img
            src="https://wedding.aqsh.co.jp/uploads/thumbnails/thumb_6UFVwV9tSkdM0xu4csxaufMW3A6lZ7SIRA5pSzsQ.jpg"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Takahiro & Yuri</h2>
            <p className="text-sm text-gray-500 mb-3">Happy Wedding - 2026.5.24</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-center">
              <div>
                <span className="block font-bold text-lg text-gray-900">{mediaCount}</span>
                <span className="text-xs text-gray-500">posts</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-gray-900">{totalLikes}</span>
                <span className="text-xs text-gray-500">likes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSlideshow}
                disabled={isMediaEmpty}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors bg-blue-50 text-blue-500 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-1 md:mr-2" />
                <span>スライドショー</span>
              </button>
              <button
                onClick={onBatchDownload}
                disabled={isDownloading || isMediaEmpty}
                className={`hidden md:flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDownloading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-tiffany/10 text-tiffany hover:bg-tiffany/20'
                  }`}
              >
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isDownloading ? '作成中...' : '一括保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-800">
        <p>本日はご参加ありがとうございます！</p>
        <p>皆様が撮ってくれた写真や動画をアップロードしてください</p>
        <p>メッセージのみの投稿も大歓迎です！</p>
        {(openingVisible || profileVisible) && (
          <div className="mt-4 space-y-3">
            {openingVisible && (
              <a href="https://youtu.be/j_gL1PAwhU8" target="_blank" rel="noreferrer" className="block text-blue-600 font-medium hover:underline">🎬 オープニングムービー</a>
            )}
            {profileVisible && (
              <a href="https://youtu.be/otRY-urOfKc" target="_blank" rel="noreferrer" className="block text-blue-600 font-medium hover:underline">🎬 プロフィールムービー</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderProfile;
