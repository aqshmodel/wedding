import React, { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { getGuestUuid } from '../utils/storage';
import UploadModal from './UploadModal';
import SlideshowModal from './SlideshowModal';
import MediaDetailModal from './MediaDetailModal';
import type { Media } from '../types';
import { useBackgroundUpload } from '../hooks/useBackgroundUpload';
import { useBatchDownload } from '../hooks/useBatchDownload';

import HeaderProfile from './MainView/HeaderProfile';
import TabNavigation from './MainView/TabNavigation';
import FilterAndSortBar from './MainView/FilterAndSortBar';
import MediaGrid from './MainView/MediaGrid';
import MessageList from './MainView/MessageList';

const MainView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'messages'>('images');
  const [guestSideFilter, setGuestSideFilter] = useState<'all' | 'groom' | 'bride'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular'>('newest');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);

  // カスタムフックの呼び出し
  const { uploadQueue, setUploadQueue } = useBackgroundUpload(() => {
    fetchMedia(1, false);
  });
  const { isDownloading, handleBatchDownload } = useBatchDownload();

  // フィルターとソートを適用
  const filteredMediaList = mediaList.filter(m => {
    if (guestSideFilter === 'all') return true;
    return m.guest_side === guestSideFilter;
  }).sort((a, b) => {
    if (sortOrder === 'popular') {
      return b.likes_count - a.likes_count;
    }
    // newest（デフォルトはAPIからの取得順、またはid降順）
    return b.id - a.id;
  });

  const fetchMedia = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      const guestUuid = getGuestUuid();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://wedding.aqsh.co.jp/api'}/media?guest_uuid=${guestUuid}&page=${page}`);
      const responseData = await response.json();
      const data = responseData.data ? responseData.data : responseData;
      
      const newMedia = Array.isArray(data) ? data : [];
      if (isLoadMore) {
        setMediaList(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMedia.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setMediaList(newMedia);
      }

      if (responseData.current_page && responseData.last_page) {
        setHasMore(responseData.current_page < responseData.last_page);
      } else {
        setHasMore(false);
      }
      if (responseData.total_likes !== undefined) {
        setTotalLikes(responseData.total_likes);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedia(1, false);
  }, []);

  useEffect(() => {
    fetchMedia(1, false);
  }, []);

  const handleLikeChange = (mediaId: number, isLiked: boolean, newCount: number) => {
    setMediaList(prev => {
      let diff = 0;
      const next = prev.map(m => {
        if (m.id === mediaId) {
          diff = newCount - m.likes_count;
          return { ...m, is_liked: isLiked, likes_count: newCount };
        }
        return m;
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
      <HeaderProfile 
        mediaCount={mediaList.length}
        totalLikes={totalLikes}
        isDownloading={isDownloading}
        isMediaEmpty={filteredMediaList.length === 0}
        onBatchDownload={() => handleBatchDownload(filteredMediaList)}
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
        {hasMore && (
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={() => fetchMedia(currentPage + 1, true)}
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
