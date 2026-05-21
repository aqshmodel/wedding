import React, { useState, useEffect } from 'react';
import { Trophy, Image as ImageIcon, Video, Heart, Settings, Loader2 } from 'lucide-react';
import api from '../../utils/api';

interface RankingData {
  posts: {
    uploader_uuid: string;
    uploader_name: string;
    image_count: number;
    video_count: number;
    total_count: number;
  }[];
  likes: {
    uploader_uuid: string;
    uploader_name: string;
    total_likes: number;
  }[];
}

const AdminView: React.FC = () => {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [openingVisible, setOpeningVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [bestCameramanVisible, setBestCameramanVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [rankingRes, settingsRes] = await Promise.all([
          api.get('/admin/ranking'),
          api.get('/settings')
        ]);
        setRanking(rankingRes.data);
        setOpeningVisible(settingsRes.data.opening_movie_visible);
        setProfileVisible(settingsRes.data.profile_movie_visible);
        setBestCameramanVisible(settingsRes.data.best_cameraman_visible);
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleToggleOpening = async () => {
    const newValue = !openingVisible;
    setOpeningVisible(newValue);
    setIsSaving(true);
    try {
      await api.post('/settings', { opening_movie_visible: newValue, profile_movie_visible: profileVisible });
    } catch (error) {
      console.error('Failed to update settings', error);
      setOpeningVisible(!newValue); // revert
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProfile = async () => {
    const newValue = !profileVisible;
    setProfileVisible(newValue);
    setIsSaving(true);
    try {
      await api.post('/settings', { opening_movie_visible: openingVisible, profile_movie_visible: newValue, best_cameraman_visible: bestCameramanVisible });
    } catch (error) {
      console.error('Failed to update settings', error);
      setProfileVisible(!newValue); // revert
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBestCameraman = async () => {
    const newValue = !bestCameramanVisible;
    setBestCameramanVisible(newValue);
    setIsSaving(true);
    try {
      await api.post('/settings', { opening_movie_visible: openingVisible, profile_movie_visible: profileVisible, best_cameraman_visible: newValue });
    } catch (error) {
      console.error('Failed to update settings', error);
      setBestCameramanVisible(!newValue); // revert
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-tiffany" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <Settings className="w-6 h-6 text-tiffany" />
            <h1 className="font-bold text-lg md:text-xl">Wedding Admin Dashboard</h1>
          </div>
          <a href="/" className="text-sm text-tiffany font-medium hover:underline">
            TOP
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Settings Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            表示設定
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">オープニングムービーの表示</p>
                <p className="text-sm text-gray-500 mt-1">フロントエンド画面にオープニングムービーのリンクを表示します</p>
              </div>
              <button
                onClick={handleToggleOpening}
                disabled={isSaving}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-tiffany focus:ring-offset-2 ${
                  openingVisible ? 'bg-tiffany' : 'bg-gray-200'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    openingVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900">プロフィールムービーの表示</p>
                <p className="text-sm text-gray-500 mt-1">フロントエンド画面にプロフィールムービーのリンクを表示します</p>
              </div>
              <button
                onClick={handleToggleProfile}
                disabled={isSaving}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-tiffany focus:ring-offset-2 ${
                  profileVisible ? 'bg-tiffany' : 'bg-gray-200'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profileVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900">ベストカメラマン発表</p>
                <p className="text-sm text-gray-500 mt-1">フロントエンド画面に最多投稿者の発表枠を表示します</p>
              </div>
              <button
                onClick={handleToggleBestCameraman}
                disabled={isSaving}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-tiffany focus:ring-offset-2 ${
                  bestCameramanVisible ? 'bg-tiffany' : 'bg-gray-200'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    bestCameramanVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Post Ranking Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              投稿数ランキング
            </h2>
            <div className="space-y-4">
              {ranking?.posts.map((user, index) => (
                <div key={user.uploader_uuid} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{user.uploader_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {user.image_count}</span>
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {user.video_count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{user.total_count}</p>
                    <p className="text-[10px] text-gray-400">Total</p>
                  </div>
                </div>
              ))}
              {ranking?.posts.length === 0 && (
                <p className="text-center text-gray-500 py-4">データがありません</p>
              )}
            </div>
          </section>

          {/* Likes Ranking Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              獲得いいねランキング
            </h2>
            <div className="space-y-4">
              {ranking?.likes.map((user, index) => (
                <div key={user.uploader_uuid} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-pink-100 text-pink-600' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <p className="font-bold text-gray-900">{user.uploader_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 flex items-center justify-end gap-1">
                      {user.total_likes}
                    </p>
                    <p className="text-[10px] text-gray-400">Likes</p>
                  </div>
                </div>
              ))}
              {ranking?.likes.length === 0 && (
                <p className="text-center text-gray-500 py-4">データがありません</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminView;
