import React, { useState, useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { Download, X, Sparkles } from 'lucide-react';

interface InstallAppBannerProps {
  onOpenModal: () => void;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({
  onOpenModal,
  deferredPrompt,
  setDeferredPrompt
}) => {
  const { language, showToast } = useChit();
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show banner when Chrome triggers the prompt event
      const dismissed = sessionStorage.getItem('varalaxmi_install_banner_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also auto-show after 2 seconds on mobile/desktop if not already running standalone
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('varalaxmi_install_banner_dismissed');
      if (!dismissed && !checkStandalone()) {
        setIsVisible(true);
      }
    }, 2200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  if (isStandalone || !isVisible) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast(
            language === 'te' ? '🎉 యాప్ విజయవంతంగా ఇన్‌స్టాల్ చేయబడింది!' : '🎉 App installed successfully!',
            language === 'te' ? 'మీ మొబైల్ హోమ్ స్క్రీన్ నుండి నేరుగా ఓపెన్ చేసుకోవచ్చు.' : 'You can now launch it directly from your home screen.',
            'info'
          );
          setIsVisible(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Install error:', err);
        onOpenModal();
      }
    } else {
      // If no native prompt (e.g. iOS Safari or already visited Chrome), open step-by-step modal guide
      onOpenModal();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('varalaxmi_install_banner_dismissed', 'true');
  };

  return (
    <aside className="pwa-install-floating-banner animate-slide-up" aria-label="Install App Banner">
      <div className="banner-content-wrap">
        <div className="banner-left">
          <div className="banner-coin-thumb">
            <img src="/app-icon.svg" alt="App Icon" className="banner-coin-img" />
          </div>
          <div className="banner-text-block">
            <div className="banner-title-line">
              <span className="banner-app-title">
                {language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ యాప్' : 'Sri Varalaxmi Chits App'}
              </span>
              <span className="banner-badge-free">
                <Sparkles size={11} className="text-amber-300" />
                <span>PWA</span>
              </span>
            </div>
            <p className="banner-sub-line">
              {language === 'te' 
                ? 'హోమ్ స్క్రీన్‌కు యాడ్ చేసుకోండి • వేగంగా ఓపెన్ అవుతుంది' 
                : 'Add to Home Screen • Instant Fullscreen Launch'}
            </p>
          </div>
        </div>

        <div className="banner-actions-wrap">
          <button
            type="button"
            className="banner-install-btn"
            onClick={handleInstallClick}
          >
            <Download size={15} />
            <span>{language === 'te' ? 'ఇన్‌స్టాల్ చేయండి' : 'Install App'}</span>
          </button>
          <button
            type="button"
            className="banner-close-btn"
            onClick={handleDismiss}
            aria-label="Dismiss"
            title={language === 'te' ? 'తర్వాత' : 'Later'}
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};
