import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

const sizeMap = {
  small: 'h-4 w-4 border-2',
  medium: 'h-8 w-8 border-2',
  large: 'h-12 w-12 border-2',
};

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'white',
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeMap[size]} ${className}`}
      style={{ borderBottomColor: color }}
      aria-label="Loading"
    />
  );
} 