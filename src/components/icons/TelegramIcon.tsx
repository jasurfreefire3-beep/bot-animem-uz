import React from 'react';

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.294.26-.537.26l.192-3.003 5.46-4.932c.237-.21-.052-.328-.369-.117l-6.75 4.25-2.911-.91c-.633-.198-.646-.633.13-.935l11.38-4.385c.527-.198.988.117.848.895z"/>
    </svg>
  );
};
