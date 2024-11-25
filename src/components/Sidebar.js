'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { permissionUtils } from '@/lib/permissions';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  // Check if menu item is active
  const isActive = (path) => {
    if (path === '#') return false;
    return pathname.startsWith(path);
  };

  const menuItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: '📊',
      permission: 'view_dashboard'
    },
    { 
      title: 'Manage Users', 
      path: '/manage-users', 
      icon: '👥',
      permission: ['manage_users', 'view_users']
    },
    { 
      title: 'Profile', 
      path: '/profile', 
      icon: '👤',
      permission: 'edit_profile'
    },
    { 
      title: 'Settings', 
      path: '/settings', 
      icon: '⚙️',
      permission: 'edit_settings'
    },
    { 
      title: 'Logout', 
      path: '#', 
      icon: '🚪',
      onClick: handleLogout 
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || 
    (Array.isArray(item.permission) 
      ? permissionUtils.hasAnyPermission(userData?.role, item.permission)
      : permissionUtils.hasPermission(userData?.role, item.permission))
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-gray-100 dark:bg-gray-800 shadow-lg"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:top-0 w-64`}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4">
              {/* User Info */}
              <div className="mt-6 mb-8 text-center">
                <div className="h-20 w-20 rounded-full bg-indigo-600 mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials(userData?.name)}
                </div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {userData?.name || 'User'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userData?.email}
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 inline-block">
                  {userData?.role?.[0] || 'user'}
                </div>
              </div>

              <nav className="mt-8">
                <ul className="space-y-2">
                  {filteredMenuItems.map((item) => (
                    <li key={item.path}>
                      {item.onClick ? (
                        <button
                          onClick={item.onClick}
                          className="w-full flex items-center gap-4 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <span>{item.icon}</span>
                          {item.title}
                        </button>
                      ) : (
                        <Link
                          href={item.path}
                          className={`flex items-center gap-4 px-4 py-2 rounded-md transition-colors
                            ${isActive(item.path)
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{item.icon}</span>
                          {item.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 