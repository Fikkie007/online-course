'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  role: 'student' | 'mentor' | 'admin';
  variant?: 'light' | 'dark'; // light for white sidebar, dark for colored sidebar
}

const typeIcons = {
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.497.149-.149.198-.298.298-.497.099-.198.05-.371-.025-.519-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.5-.173 0-.371-.025-.545-.025-.198 0-.545.075-.829.497-.298.447-1.165 1.612-1.165 3.879 0 2.267 1.665 4.449 1.912 4.773.247.324 3.276 5.089 8.096 7.063 1.165.497 2.073.793 2.796.997.966.324 1.864.273 2.56.198.786-.075 2.4-.99 2.722-1.946.324-.958.324-1.79.223-1.946-.099-.149-.297-.223-.595-.371z"/>
    </svg>
  ),
  in_app: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

const typeColors = {
  email: 'bg-purple-100 text-purple-600',
  whatsapp: 'bg-green-100 text-green-600',
  in_app: 'bg-blue-100 text-blue-600',
};

export function NotificationBell({ role, variant = 'dark' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, placement: 'right' });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const basePath = role === 'student' ? '/student' : role === 'mentor' ? '/mentor' : '/admin';

  // Styling based on variant
  const buttonStyles = variant === 'light'
    ? 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300'
    : 'text-white hover:bg-white/20 focus:ring-white/30';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 360;
      const dropdownHeight = 420;
      const padding = 12;

      const isDesktop = window.innerWidth >= 1024;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (isDesktop) {
        // Desktop: try to position to the right, otherwise to the left
        const rightSpace = viewportWidth - rect.right - padding;
        const leftSpace = rect.left - padding;

        let placement: 'right' | 'left' = 'right';
        let leftPos = rect.right + padding;

        if (rightSpace < dropdownWidth && leftSpace >= dropdownWidth) {
          placement = 'left';
          leftPos = rect.left - dropdownWidth - padding;
        }

        // Calculate top position - align bottom of dropdown near button
        let topPos = rect.bottom - dropdownHeight + 50;

        // Ensure dropdown doesn't go above viewport
        if (topPos < padding) {
          topPos = padding;
        }

        // Ensure dropdown doesn't go below viewport
        if (topPos + dropdownHeight > viewportHeight - padding) {
          topPos = viewportHeight - dropdownHeight - padding;
        }

        setDropdownPosition({ top: topPos, left: leftPos, placement });
      } else {
        // Mobile: center below button
        let leftPos = rect.left + rect.width / 2 - dropdownWidth / 2;
        let topPos = rect.bottom + padding;

        // Clamp to viewport
        if (leftPos < padding) leftPos = padding;
        if (leftPos + dropdownWidth > viewportWidth - padding) {
          leftPos = viewportWidth - dropdownWidth - padding;
        }

        // If not enough space below, show above
        if (topPos + dropdownHeight > viewportHeight - padding) {
          topPos = rect.top - dropdownHeight - padding;
        }

        setDropdownPosition({ top: topPos, left: leftPos, placement: 'right' });
      }
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success && data.data) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 ${buttonStyles}`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[11px] rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown via Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div
            ref={dropdownRef}
            className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: '360px',
              maxHeight: '420px',
            }}
          >
            {/* Arrow indicator for desktop */}
            {window.innerWidth >= 1024 && (
              <div
                className={`absolute top-8 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 ${
                  dropdownPosition.placement === 'right' ? '-left-1.5' : '-right-1.5'
                }`}
              />
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-5 py-4 hover:bg-gray-50/80 cursor-pointer transition-all duration-150 group ${
                        !notification.is_read ? 'bg-gradient-to-r from-blue-50/50 to-transparent' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          typeColors[notification.type as keyof typeof typeColors] || typeColors.in_app
                        }`}>
                          {typeIcons[notification.type as keyof typeof typeIcons] || typeIcons.in_app}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Semua notifikasi sudah dibaca</p>
                  <p className="text-xs text-gray-400 mt-1">Tidak ada pesan baru saat ini</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <Link
                  href={`${basePath}/notifications`}
                  className="flex items-center justify-center gap-2 w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium py-2 rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Lihat semua notifikasi</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}