import React from 'react';
import clsx from 'clsx';

interface NavBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentPath, onNavigate }) => {
  const navItems = [
    { path: '/', label: '舌诊辨证', icon: '🔍' },
    { path: '/cases', label: '病例管理', icon: '📋' },
    { path: '/knowledge', label: '知识库', icon: '📚' },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
              <span className="text-white text-xl">👅</span>
            </div>
            <div>
              <h1 className="font-chinese text-lg font-semibold text-stone-800">舌诊辅助系统</h1>
              <p className="text-xs text-stone-500">智能辨证 · 精准选穴</p>
            </div>
          </div>

          {/* 导航链接 */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={clsx(
                  'nav-link flex items-center gap-2',
                  currentPath === item.path && 'nav-link-active'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* 用户信息 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-700">李长欣</p>
              <p className="text-xs text-stone-500">中医师</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
              李
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
