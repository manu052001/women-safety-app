import React from 'react';
import { Home, Users, MessageSquare, ShieldAlert, Settings } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { view: AppView.HOME, icon: Home, label: 'Home' },
    { view: AppView.CONTACTS, icon: Users, label: 'Contacts' },
    { view: AppView.TOOLS, icon: ShieldAlert, label: 'Tools' },
    { view: AppView.CHAT, icon: MessageSquare, label: 'AI Help' },
    { view: AppView.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-guardian-card/90 backdrop-blur-md border-t border-gray-700/50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onChangeView(item.view)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-guardian-red' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};