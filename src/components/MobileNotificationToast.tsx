import React, { useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { Bell, CheckCircle2, Trophy, X, AlertCircle } from 'lucide-react';

export const MobileNotificationToast: React.FC = () => {
  const { activeToast, dismissToast, language } = useChit();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const isLottery = activeToast.type === 'lottery';
  const isPayment = activeToast.type === 'payment';

  return (
    <div className="mobile-push-banner" onClick={dismissToast}>
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
          dismissToast();
        }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

