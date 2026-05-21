import React, { useState, useEffect } from 'react';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { getGuestUuid } from '../utils/storage';
import UploadModal from './UploadModal';
import SlideshowModal from './SlideshowModal';
import MediaDetailModal from './MediaDetailModal';
import type { Media } from '../types';
import { useBackgroundUpload } from '../hooks/useBackgroundUpload';
import { useBatchDownload } from '../hooks/useBatchDownload';
import { useNewPostsNotifier } from '../hooks/useNewPostsNotifier';
import NewPostsBadge from './MainView/NewPostsBadge';

import HeaderProfile from './MainView/HeaderProfile';
import TabNavigation from './MainView/TabNavigation';
import FilterAndSortBar from './MainView/FilterAndSortBar';
import MediaGrid from './MainView/MediaGrid';
import MessageList from './MainView/MessageList';

const MainView: React.FC = () => {
  type TabType = 'images' | 'videos' | 'messages';
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [guestSideFilter, setGuestSideFilter] = useState<'all' | 'groom' | 'bride'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular'>('newest');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  
  // タブごとのデータ管理
  const [mediaData, setMediaData] = useState<Record<TabType, Media[]>>({ images: [], videos: [], messages: [] });
  const [pageData, setPageData] = useState<Record<TabType, number>>({ images: 1, videos: 1, messages: 1 });
  const [hasMoreData, setHasMoreData] = useState<Record<TabType, boolean>>({ images: false, videos: false, messages: false });
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);

  // カスタムフックの呼び出し
  const { uploadQueue, setUploadQueue } = useBackgroundUpload(() => {
    fetchMedia(1, false);
  });
  const { isDownloading, handleBatchDownload } = useBatchDownload();
  const { hasNewPosts, resetNotifier } = useNewPostsNotifier(totalPosts);

  const handleNewPostsClick = () => {
    resetNotifier();
    fetchMedia(1, false, activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // フィルターとソートを適用 (現在のアクティブタブのデータに対して)
  const currentMediaList = mediaData[activeTab];
  const filteredMediaList = currentMediaList.filter(m => {
    if (guestSideFilter === 'all') return true;
    return m.guest_side === guestSideFilter;
  }).sort((a, b) => {
    if (sortOrder === 'popular') {
      return b.likes_count - a.likes_count;
    }
    // newest（デフォルトはAPIからの取得順、またはid降順）
    return b.id - a.id;
  });

  const fetchMedia = async (page = 1, isLoadMore = false, type: TabType = 'images') => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      const guestUuid = getGuestUuid();
      const apiType = type === 'images' ? 'image' : type === 'videos' ? 'video' : 'message';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://wedding.aqsh.co.jp/api'}/media?guest_uuid=${guestUuid}&page=${page}&type=${apiType}`);
      const responseData = await response.json();
      const data = responseData.data ? responseData.data : responseData;
      
      const newMedia = Array.isArray(data) ? data : [];
      if (isLoadMore) {
        setMediaData(prev => {
          const existingIds = new Set(prev[type].map(m => m.id));
          const uniqueNew = newMedia.filter(m => !existingIds.has(m.id));
          return { ...prev, [type]: [...prev[type], ...uniqueNew] };
        });
      } else {
        setMediaData(prev => ({ ...prev, [type]: newMedia }));
      }

      if (responseData.current_page && responseData.last_page) {
        setHasMoreData(prev => ({ ...prev, [type]: responseData.current_page < responseData.last_page }));
      } else {
        setHasMoreData(prev => ({ ...prev, [type]: false }));
      }
      
      if (responseData.total_likes !== undefined) {
        setTotalLikes(responseData.total_likes);
      }
      if (responseData.total_posts !== undefined) {
        setTotalPosts(responseData.total_posts);
      }
      
      setPageData(prev => ({ ...prev, [type]: page }));
    } catch (error) {
      console.error(`Failed to fetch media for ${type}:`, error);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    // 初回マウント時、まず images を取得し、裏で他のタブもプリロード
    fetchMedia(1, false, 'images').then(() => {
      fetchMedia(1, false, 'videos');
      fetchMedia(1, false, 'messages');
    });
  }, []);

  // タブ切り替え時にデータが空なら念のため取得
  useEffect(() => {
    if (mediaData[activeTab].length === 0) {
      fetchMedia(1, false, activeTab);
    }
  }, [activeTab]);

  const handleLikeChange = (mediaId: number, isLiked: boolean, newCount: number) => {
    setMediaData(prev => {
      let diff = 0;
      const next = { ...prev };
      
      (Object.keys(next) as TabType[]).forEach(key => {
        next[key] = next[key].map(m => {
          if (m.id === mediaId) {
            diff = newCount - m.likes_count;
            return { ...m, is_liked: isLiked, likes_count: newCount };
          }
          return m;
        });
      });
      
      setTotalLikes(t => t + diff);
      return next;
    });
    if (selectedMedia && selectedMedia.id === mediaId) {
      setSelectedMedia({ ...selectedMedia, is_liked: isLiked, likes_count: newCount });
    }
  };

  // --------------------------------------------------------
  // モーダル用の前・次ナビゲーション（フィルター適用済みのリストから）
  // --------------------------------------------------------
  const currentTabList = filteredMediaList.filter(m => {
    if (activeTab === 'images') return m.type === 'image';
    if (activeTab === 'videos') return m.type === 'video';
    return false;
  });

  const selectedIndex = selectedMedia ? currentTabList.findIndex(m => m.id === selectedMedia.id) : -1;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex !== -1 && selectedIndex < currentTabList.length - 1;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrev) {
      setSelectedMedia(currentTabList[selectedIndex - 1]);
    } else if (direction === 'next' && hasNext) {
      setSelectedMedia(currentTabList[selectedIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[1000px] mx-auto relative pb-20 shadow-xl overflow-hidden">
      <NewPostsBadge show={hasNewPosts} onClick={handleNewPostsClick} />
      <HeaderProfile 
        mediaCount={totalPosts}
        totalLikes={totalLikes}
        isDownloading={isDownloading}
        isMediaEmpty={mediaData['images'].length === 0}
        onBatchDownload={() => handleBatchDownload(mediaData['images'])}
        onOpenSlideshow={() => setIsSlideshowOpen(true)}
      />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <FilterAndSortBar 
        guestSideFilter={guestSideFilter} 
        sortOrder={sortOrder}
        onFilterChange={setGuestSideFilter}
        onSortChange={setSortOrder}
      />

      <div className="bg-white min-h-[50vh]">
        {activeTab === 'images' && <MediaGrid mediaList={filteredMediaList} type="image" onMediaClick={setSelectedMedia} />}
        {activeTab === 'videos' && <MediaGrid mediaList={filteredMediaList} type="video" onMediaClick={setSelectedMedia} />}
        {activeTab === 'messages' && <MessageList mediaList={filteredMediaList} onLikeChange={handleLikeChange} />}

        {/* Load More Button */}
        {hasMoreData[activeTab] && (
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={() => fetchMedia(pageData[activeTab] + 1, true, activeTab)}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center shadow-sm"
            >
              {isLoadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoadingMore ? '読み込み中...' : 'もっと見る'}
            </button>
          </div>
        )}
      </div>

      {/* FAB (Upload Button) */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-tiffany rounded-full flex items-center justify-center text-white shadow-lg hover:bg-tiffany-dark transition-colors z-20 xl:right-[calc(50%-480px)]"
      >
        <Plus size={28} />
      </button>

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={() => {}} // 互換性のため残す
          onSubmitToBackground={(files, name, message) => {
            setIsUploadModalOpen(false);
            setUploadQueue({
              files,
              name,
              message,
              progress: 0,
              total: Math.max(files.length, 1),
              currentIndex: 0,
              isUploading: true,
              status: 'uploading'
            });
          }}
        />
      )}

      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onLikeChange={handleLikeChange}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onNavigate={handleNavigate}
        />
      )}

      {isSlideshowOpen && (
        <SlideshowModal
          initialMediaList={filteredMediaList}
          guestSideFilter={guestSideFilter}
          onClose={() => setIsSlideshowOpen(false)}
        />
      )}

      {/* バックグラウンドアップロードのトースト通知 */}
      {uploadQueue && uploadQueue.status !== 'idle' && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-3 transition-all duration-300">
          {uploadQueue.status === 'uploading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-tiffany" />
              <span className="text-sm font-medium">
                アップロード中... {uploadQueue.currentIndex} / {uploadQueue.total}枚
              </span>
            </>
          ) : uploadQueue.status === 'completed' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">アップロード完了！</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default MainView;
