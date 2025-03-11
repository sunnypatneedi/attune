'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation bar with links to main pages
 */
export const Navigation: React.FC = () => {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div className="text-xl font-semibold text-gray-800">
        Adaptive Chat UI
      </div>
      
      <div className="flex gap-6">
        <Link 
          href="/" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            pathname === '/' 
              ? 'bg-gray-100 text-gray-900' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Chat
        </Link>
        
        <Link 
          href="/demo" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            pathname === '/demo' 
              ? 'bg-gray-100 text-gray-900' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Enhanced Understanding Demo
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
