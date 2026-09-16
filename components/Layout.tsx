import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 relative overflow-hidden">
      {/* Decorative Background Elements (Glass effect base) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 dark:opacity-10 bg-gradient-to-br from-primary to-secondary blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-20 dark:opacity-10 bg-gradient-to-tl from-cta to-coffee-brown blur-[100px]"></div>
      </div>
      <Sidebar />
      <main className="flex-1 overflow-x-hidden relative z-10 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
