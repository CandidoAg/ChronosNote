import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-white text-gray-900 antialiased">
      {children}
    </div>
  );
};