import React from 'react';
import { ArrowUp } from 'lucide-react';

interface NewPostsBadgeProps {
  show: boolean;
  onClick: () => void;
}

const NewPostsBadge: React.FC<NewPostsBadgeProps> = ({ show, onClick }) => {
  if (!show) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-tiffany text-white px-6 py-2.5 rounded-full shadow-lg font-bold text-sm hover:bg-tiffany-dark hover:scale-105 transition-all"
      >
        <ArrowUp className="w-4 h-4" />
        新しい投稿があります
      </button>
    </div>
  );
};

export default NewPostsBadge;
