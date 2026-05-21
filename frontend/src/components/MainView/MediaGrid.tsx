import React from 'react';
import { Video } from 'lucide-react';
import { getStorageUrl } from '../../utils/api';
import type { Media } from '../../types';

interface MediaGridProps {
  mediaList: Media[];
  type: 'image' | 'video';
  onMediaClick: (media: Media) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ mediaList, type, onMediaClick }) => {
  const filteredList = mediaList.filter(m => m.type === type);

  if (filteredList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <p className="mb-2 font-medium">まだ投稿がありません</p>
        <p className="text-sm">最初の投稿をお待ちしています！</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {filteredList.map((media) => (
        <div 
          key={media.id} 
          className="aspect-square bg-gray-100 relative group cursor-pointer"
          onClick={() => onMediaClick(media)}
        >
          {type === 'video' ? (
            <>
              {media.thumbnail_path ? (
                <img
                  src={getStorageUrl(media.thumbnail_path)}
                  alt={media.message || "動画サムネイル"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={getStorageUrl(media.file_path!)}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                <Video size={24} className="text-white drop-shadow-md" />
              </div>
            </>
          ) : (
            <img
              src={getStorageUrl(media.thumbnail_path || media.file_path!)}
              alt={media.message || "写真"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaGrid;
