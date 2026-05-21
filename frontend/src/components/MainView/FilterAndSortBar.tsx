import React from 'react';

interface FilterAndSortBarProps {
  guestSideFilter: 'all' | 'groom' | 'bride' | 'mine';
  sortOrder: 'newest' | 'popular';
  onFilterChange: (filter: 'all' | 'groom' | 'bride' | 'mine') => void;
  onSortChange: (sort: 'newest' | 'popular') => void;
}

const FilterAndSortBar: React.FC<FilterAndSortBarProps> = ({
  guestSideFilter,
  sortOrder,
  onFilterChange,
  onSortChange
}) => {
  // フィルター変更時、もし「All」が選ばれたらソート順も「newest」に戻す
  const handleFilterClick = (filter: 'all' | 'groom' | 'bride' | 'mine') => {
    onFilterChange(filter);
    if (filter === 'all') {
      onSortChange('newest');
    }
  };

  const handlePopularClick = () => {
    onSortChange(sortOrder === 'popular' ? 'newest' : 'popular');
  };

  const baseChipStyle = "px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center shrink-0 border";
  const activeStyle = "bg-gray-900 text-white border-gray-900 shadow-sm";
  const inactiveStyle = "bg-white text-gray-600 border-gray-200 hover:bg-gray-50";

  return (
    <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        onClick={() => handleFilterClick('all')}
        className={`${baseChipStyle} ${guestSideFilter === 'all' && sortOrder === 'newest' ? activeStyle : inactiveStyle}`}
      >
        All
      </button>
      <button
        onClick={() => handleFilterClick('groom')}
        className={`${baseChipStyle} ${guestSideFilter === 'groom' ? activeStyle : inactiveStyle}`}
      >
        新郎ゲスト
      </button>
      <button
        onClick={() => handleFilterClick('bride')}
        className={`${baseChipStyle} ${guestSideFilter === 'bride' ? activeStyle : inactiveStyle}`}
      >
        新婦ゲスト
      </button>
      <button
        onClick={() => handleFilterClick('mine')}
        className={`${baseChipStyle} ${guestSideFilter === 'mine' ? activeStyle : inactiveStyle}`}
      >
        自分の投稿
      </button>

      <button
        onClick={handlePopularClick}
        className={`${baseChipStyle} ${sortOrder === 'popular' ? activeStyle : inactiveStyle}`}
      >
        <span className="mr-1"></span> 人気順
      </button>
    </div>
  );
};

export default FilterAndSortBar;
