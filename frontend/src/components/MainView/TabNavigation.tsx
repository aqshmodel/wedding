import React from 'react';
import { Camera, Video, MessageCircle } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'images' | 'videos' | 'messages';
  onTabChange: (tab: 'images' | 'videos' | 'messages') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
      <button
        onClick={() => onTabChange('images')}
        className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'images' ? 'border-tiffany text-tiffany' : 'border-transparent text-gray-400'}`}
      >
        <Camera size={24} />
      </button>
      <button
        onClick={() => onTabChange('videos')}
        className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'videos' ? 'border-tiffany text-tiffany' : 'border-transparent text-gray-400'}`}
      >
        <Video size={24} />
      </button>
      <button
        onClick={() => onTabChange('messages')}
        className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'messages' ? 'border-tiffany text-tiffany' : 'border-transparent text-gray-400'}`}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default TabNavigation;
