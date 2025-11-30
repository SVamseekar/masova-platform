import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = ''
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string
}) => {
  const variants = {
    default: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    destructive: 'bg-red-500 text-white',
    outline: 'border border-gray-300 text-gray-700'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
