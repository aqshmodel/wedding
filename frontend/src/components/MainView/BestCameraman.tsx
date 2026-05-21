import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import api from '../../utils/api';

interface BestCameramanData {
  uploader_uuid: string;
  uploader_name: string;
  total_count: number;
}

const BestCameraman: React.FC = () => {
  const [cameramen, setCameramen] = useState<BestCameramanData[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchBestCameraman = async () => {
      try {
        // 設定情報の取得
        const settingsRes = await api.get('/settings');
        if (settingsRes.data.best_cameraman_visible) {
          setIsVisible(true);
          // キャッシュされたランキングトップの取得
          const topRes = await api.get('/ranking/top');
          setCameramen(topRes.data.best_cameraman || []);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Failed to fetch best cameraman data:', error);
      }
    };

    fetchBestCameraman();
  }, []);

  if (!isVisible || cameramen.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 mb-4 animate-fade-in-up">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-200/50 shadow-sm relative overflow-hidden">
        {/* 背景の装飾 */}
        <div className="absolute -right-4 -top-4 text-yellow-100 opacity-50 transform rotate-12">
          <Trophy size={100} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-yellow-800 text-sm tracking-wider">BEST CAMERAMAN</h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          
          <div className="flex flex-col items-center justify-center gap-2">
            {cameramen.map((cameraman, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm border border-yellow-100">
                <span className="font-bold text-gray-900 text-lg">{cameraman.uploader_name}</span>
                <span className="text-sm font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                  {cameraman.total_count} 枚
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xs text-yellow-700/80 mt-3 font-medium">
            たくさんの素敵な写真・動画をありがとうございます！🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default BestCameraman;
