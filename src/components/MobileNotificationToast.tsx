import React, { useEffect, useState, useRef } from 'react';
import { useChit } from '../context/ChitContext';
import { Bell, CheckCircle2, Trophy, X } from 'lucide-react';

export const MobileNotificationToast: React.FC = () => {
  const { activeToast, dismissToast, language } = useChit();
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss smoothly after 4 seconds
  useEffect(() => {
    if (!activeToast) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        dismissToast();
        setIsExiting(false);
      }, 350);
    }, 4000);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [activeToast?.id, dismissToast]);

  if (!activeToast) return null;

  const handleManualDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setIsExiting(true);
    setTimeout(() => {
      dismissToast();
      setIsExiting(false);
    }, 250);
  };

  const isLottery = activeToast.type === 'lottery';
  const isPayment = activeToast.type === 'payment';

  return (
    <div 
      className={`mobile-push-banner ${isExiting ? 'push-banner-exit' : ''}`} 
      onClick={handleManualDismiss}
      role="alert"
    >
      <div className="push-banner-icon">
        {isLottery ? (
          <Trophy size={22} className="text-gray-950" />
        ) : isPayment ? (
          <CheckCircle2 size={22} className="text-gray-950" />
        ) : (
          <Bell size={22} className="text-gray-950" />
        )}
      </div>

      <div className="push-banner-content">
        <div className="push-banner-header">
          <span className="push-banner-title">
            {language === 'te' ? (activeToast.titleTe || activeToast.title) : activeToast.title}
          </span>
          <span className="push-banner-time">
            {language === 'te' ? 'ఇప్పుడే • LIVE' : 'Just now • LIVE'}
          </span>
        </div>
        <p className="push-banner-msg">
          {language === 'te' ? (activeToast.messageTe || activeToast.message) : activeToast.message}
        </p>
      </div>

      <button
        type="button"
        className="push-banner-close"
        onClick={(e) => {
          e.stopPropagation();
          handleManualDismiss();
        }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};
