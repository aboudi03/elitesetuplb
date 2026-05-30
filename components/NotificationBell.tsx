'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaBell } from 'react-icons/fa6';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useSession } from 'next-auth/react';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = "" }) => {
  const { data: session } = useSession();
  const { unreadCount } = useUnreadCount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show notification bell if user is not logged in
  if (!session?.user) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--site-text)] transition-colors duration-200 hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)] md:h-auto md:w-auto md:rounded-full md:p-2"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FaBell className="h-5 w-5 md:h-6 md:w-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-[var(--site-accent)] text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] shadow-lg max-sm:-right-16">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--site-border)] p-4">
            <h3 className="text-lg font-semibold text-[var(--site-text)]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-[var(--site-muted)]">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-b border-[var(--site-border)] p-4">
            <div className="flex gap-2 max-[360px]:flex-col">
              <Link
                href="/notifications"
                onClick={() => setIsDropdownOpen(false)}
                className="flex-1 rounded-md border border-[var(--site-accent)] bg-[var(--site-accent-soft)] px-3 py-2 text-center text-sm font-medium text-[var(--site-accent)] transition-colors hover:bg-[var(--site-panel-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]"
              >
                View All
              </Link>
              
              {unreadCount > 0 && (
                <button
                  className="flex-1 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-center text-sm font-medium text-[var(--site-muted)] transition-colors hover:text-[var(--site-text)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]"
                  onClick={() => {
                    // TODO: Implement mark all as read functionality
                    setIsDropdownOpen(false);
                  }}
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Notification Preview */}
          <div className="max-h-64 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="p-6 text-center">
                <FaBell className="mx-auto mb-3 h-12 w-12 text-[var(--site-muted)]" />
                <p className="text-sm text-[var(--site-muted)]">No new notifications</p>
                <p className="mt-1 text-xs text-[var(--site-muted)]">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <p className="mb-2 text-sm text-[var(--site-muted)]">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                  <Link
                    href="/notifications"
                    onClick={() => setIsDropdownOpen(false)}
                    className="inline-flex items-center rounded-full border border-[var(--site-accent)] bg-[var(--site-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--site-accent)] transition-colors hover:bg-[var(--site-panel-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]"
                  >
                    View in Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3">
            <Link
              href="/notifications"
              onClick={() => setIsDropdownOpen(false)}
              className="block w-full text-center text-sm text-[var(--site-muted)] transition-colors hover:text-[var(--site-accent)]"
            >
              Go to Notification Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
