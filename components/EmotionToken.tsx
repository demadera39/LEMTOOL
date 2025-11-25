import React, { useState } from 'react';
import { EmotionType } from '../types';
import { EMOTIONS } from '../constants';

interface EmotionTokenProps {
  emotion: EmotionType;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}

const EmotionToken: React.FC<EmotionTokenProps> = ({ 
  emotion, 
  size = 'md', 
  selected = false,
  onClick,
}) => {
  const def = EMOTIONS[emotion];
  const Icon = def.icon;
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10', // Increased from w-8
    md: 'w-14 h-14', // Increased from w-12
    lg: 'w-20 h-20', // Increased from w-16
  };

  const iconSize = {
    sm: 20,
    md: 28,
    lg: 40
  };
  
  const paddingClass = imgError ? 'p-2.5 bg-gray-100' : 'p-0 bg-transparent'; 

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-full flex items-center justify-center transition-transform duration-200 cursor-pointer select-none overflow-hidden
        ${sizeClasses[size]}
        ${selected ? 'ring-4 ring-white ring-opacity-50 scale-110 z-10 shadow-xl' : 'hover:scale-105 shadow-md'}
        ${paddingClass}
      `}
      title={def.description}
      role="button"
      aria-label={def.label}
    >
      {!imgError && def.src ? (
        <img 
          src={def.src} 
          alt={def.label}
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center rounded-full ${def.category === 'Positive' ? 'text-lem-orange' : 'text-gray-600'}`}>
           <Icon size={iconSize[size]} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
};

export default EmotionToken;