import React, { useState, useRef, useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { Bell, Check, Clock, Trophy, CheckCircle, Info, Sparkles } from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    activeGroupId, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    language,
    pushPermission,
    requestNotificationPermission
  } = useChit();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const groupNotifications = notifications.filter(n => !n.groupId || n.groupId === activeGroupId);
  const unreadCount = groupNotifications.filter(n => !n.isRead).length;

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'due':
        return <Clock size={16} className="text-amber-400" />;
      case 'lottery':
        return <Trophy size={16} className="text-yellow-400" />;
      case 'payment':
        return <CheckCircle size={16} className="text-emerald-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="notification-wrapper" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`btn-notification-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            markAllNotificationsAsRead();
          }
        }}
        aria-label="Notifications"
        title={language === 'te' ? 'సమాచారాలు (నోటిఫికేషన్లు)' : 'Notifications'}
      >
        <Bell size={18} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="notif-dropdown-card animate-fade">
          <div className="notif-header">
            <div className="notif-header-title">
              <Sparkles size={16} className="text-yellow-400" />
              <h4>{language === 'te' ? 'సమాచారాలు (నోటిఫికేషన్లు)' : 'Notifications'}</h4>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">
                  {unreadCount} {language === 'te' ? 'కొత్తవి' : 'new'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={markAllNotificationsAsRead}
                title={language === 'te' ? 'అన్నీ చదివినట్లు గుర్తించు' : 'Mark all as read'}
              >
                <Check size={14} />
                <span>{language === 'te' ? 'అన్నీ చదివాను' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* Mobile Web Push Phone Alert Action Banner */}
          <div className="notif-push-banner-row">
            {pushPermission === 'granted' ? (
              <div className="push-status-granted">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>{language === 'te' ? '✓ ఫోన్ లాక్-స్క్రీన్ అలర్ట్స్ ఆక్టివ్‌గా ఉన్నాయి' : '✓ Phone Lock-Screen Alerts Active'}</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn-enable-phone-push"
                onClick={async () => {
                  await requestNotificationPermission();
                }}
              >
                <Bell size={14} />
                <span>{language === 'te' ? '🔔 ఫోన్ పుష్ అలర్ట్స్ ఆన్ చేయండి' : '🔔 Enable Phone Alerts'}</span>
              </button>
            )}
          </div>

          <div className="notif-list">
            {groupNotifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={28} className="text-gray-500 mb-2 opacity-50" />
                <p>{language === 'te' ? 'ఎటువంటి సమాచారాలు లేవు' : 'No notifications yet'}</p>
              </div>
            ) : (
              groupNotifications.map(item => (
                <div
                  key={item.id}
                  className={`notif-item ${!item.isRead ? 'unread' : ''}`}
                  onClick={() => markNotificationAsRead(item.id)}
                >
                  <div className="notif-icon-wrap">
                    {getIcon(item.type)}
                  </div>
                  <div className="notif-content">
                    <div className="notif-item-top">
                      <strong className="notif-title">
                        {language === 'te' ? item.titleTe : item.title}
                      </strong>
                      {!item.isRead && <span className="notif-dot"></span>}
                    </div>
                    <p className="notif-message">
                      {language === 'te' ? item.messageTe : item.message}
                    </p>
                    <span className="notif-date">{item.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

