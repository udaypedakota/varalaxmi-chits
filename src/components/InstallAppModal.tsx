import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { X, Smartphone, Apple, Download, CheckCircle2, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const { language } = useChit();

  // Detect platform default tab
  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isIOSDevice ? 'ios' : 'android');
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="modal-backdrop-luxury animate-fade" onClick={onClose}>
      <div className="install-pwa-modal animate-scale-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="install-modal-header">
          <div className="install-brand-row">
            <div className="install-app-coin-wrap">
              <img src="/app-icon.svg" alt="Varalaxmi Chits App Icon" className="install-app-coin-img" />
            </div>
            <div>
              <h3 className="install-modal-title">
                {language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ యాప్ ఇన్‌స్టాల్' : 'Install "Sri Varalaxmi Chits"'}
              </h3>
              <p className="install-modal-sub">
                {language === 'te' 
                  ? 'మీ iPhone లేదా Android హోమ్ స్క్రీన్‌కు యాడ్ చేసుకోండి' 
                  : 'Add to your iPhone or Android Home Screen'}
              </p>
            </div>
          </div>
          <button type="button" className="install-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Device Switcher Tabs: iPhone vs Android */}
        <div className="install-device-tabs">
          <button
            type="button"
            className={`device-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Apple size={17} />
            <span>{language === 'te' ? '🍏 iPhone (iOS Safari)' : '🍏 iPhone (iOS Safari)'}</span>
          </button>
          <button
            type="button"
            className={`device-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={17} />
            <span>{language === 'te' ? '🤖 Android (Chrome)' : '🤖 Android (Chrome)'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="install-modal-body">
          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="install-guide-content animate-fade">
              {/* If browser supports one-click prompt */}
              {deferredPrompt && (
                <div className="one-click-install-box">
                  <div className="one-click-text">
                    <Sparkles size={18} className="text-amber-400 shrink-0" />
                    <span>
                      {language === 'te' 
                        ? 'ఆటోమేటిక్ ఇన్‌స్టాల్ అందుబాటులో ఉంది!' 
                        : 'Instant Installation Available!'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="one-click-btn"
                    onClick={handleNativeInstall}
                    disabled={installing}
                  >
                    <Download size={18} />
                    <span>
                      {installing 
                        ? (language === 'te' ? 'ఇన్‌స్టాల్ అవుతోంది...' : 'Installing...')
                        : (language === 'te' ? 'ఒకే క్లిక్‌తో ఇన్‌స్టాల్ చేయండి' : 'Install App Now')}
                    </span>
                  </button>
                </div>
              )}

              <div className="install-steps-list">
                <div className="install-step-item">
                  <div className="step-badge">1</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? 'Chrome బ్రౌజర్‌లో ఓపెన్ చేయండి' : 'Open in Google Chrome'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'మీ ఆండ్రాయిడ్ ఫోన్‌లో ఈ లింక్‌ను Chrome బ్రౌజర్‌లో తెరవండి.' 
                        : 'Open this link in the Google Chrome browser on your Android mobile.'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item">
                  <div className="step-badge">2</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? 'మూడు చుక్కలు (⋮) నొక్కండి' : 'Tap the Menu (⋮)'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'Chrome లో పైన కుడివైపు ఉన్న మూడు చుక్కలు (⋮) మెనూను నొక్కండి.' 
                        : 'Tap the 3 dots (⋮) in the top-right corner of Chrome.'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item highlight-step">
                  <div className="step-badge">3</div>
                  <div className="step-info">
                    <strong>
                      {language === 'te' 
                        ? '"Install app" లేదా "Add to Home screen" నొక్కండి' 
                        : 'Select "Install app" or "Add to Home screen"'}
                    </strong>
                    <p>
                      {language === 'te' 
                        ? 'మెనూ లిస్ట్‌లో కనిపించే "Install app" లేదా "హోమ్ స్క్రీన్‌కు జోడించు" ఎంచుకోండి.' 
                        : 'Choose "Install app" or "Add to Home screen" from the menu options.'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item">
                  <div className="step-badge">4</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? '"Install" నొక్కండి' : 'Tap "Install"'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'కన్ఫర్మేషన్ పాపప్‌లో Install నొక్కండి. మీ ఫోన్ యాప్‌ల జాబితాలో గోల్డ్ కాయిన్ గుర్తుతో యాప్ యాడ్ అవుతుంది!' 
                        : 'Confirm by tapping Install. Sri Varalaxmi Chits will appear on your phone home screen like a Play Store app!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="install-benefit-banner">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>
                  {language === 'te'
                    ? 'Play Store అవసరం లేకుండానే నేరుగా ఫుల్‌స్క్రీన్ యాప్ లాగా వేగంగా పనిచేస్తుంది!'
                    : 'Works seamlessly like a native Android app in fullscreen without needing the Play Store!'}
                </span>
              </div>
            </div>
          )}

          {/* IPHONE (iOS SAFARI) TAB */}
          {activeTab === 'ios' && (
            <div className="install-guide-content animate-fade">
              <div className="install-steps-list">
                <div className="install-step-item">
                  <div className="step-badge">1</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? 'Safari లో ఓపెన్ చేయండి' : 'Open in Safari Browser'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'మీ iPhone లో ఈ వెబ్‌సైట్‌ను Safari బ్రౌజర్‌లో ఓపెన్ చేయండి (Chrome లో కాదు).' 
                        : 'Open this link in Apple Safari on your iPhone (not inside Chrome or WhatsApp browser).'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item highlight-step">
                  <div className="step-badge">2</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? 'క్రింద Share గుర్తు (⬆️ / ⎋) నొక్కండి' : 'Tap the Share Button (⬆️)'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'Safari స్క్రీన్ కింద మధ్యలో ఉండే Share బటన్ (బాణం గుర్తు ⬆️) పై నొక్కండి.' 
                        : 'Tap the Share icon (box with upward arrow ⬆️) at the bottom toolbar of Safari.'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item highlight-step">
                  <div className="step-badge">3</div>
                  <div className="step-info">
                    <strong>
                      {language === 'te' 
                        ? '"Add to Home Screen" (+) ఎంచుకోండి' 
                        : 'Select "Add to Home Screen" (+)'}
                    </strong>
                    <p>
                      {language === 'te' 
                        ? 'షీట్‌ను క్రిందికి స్క్రోల్ చేసి [+] Add to Home Screen ఆప్షన్‌ను ఎంచుకోండి.' 
                        : 'Scroll down the share sheet and tap [+] Add to Home Screen.'}
                    </p>
                  </div>
                </div>

                <div className="install-step-item">
                  <div className="step-badge">4</div>
                  <div className="step-info">
                    <strong>{language === 'te' ? 'పైన "Add" నొక్కండి' : 'Tap "Add" in Top-Right'}</strong>
                    <p>
                      {language === 'te' 
                        ? 'యాప్ పేరు "Varalaxmi Chits" అని కనిపిస్తుంది. పైన కుడివైపు Add నొక్కండి. పూర్తి!' 
                        : 'The app title is pre-filled. Tap "Add" at the top right. Done!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="install-benefit-banner">
                <Sparkles size={18} className="text-amber-400 shrink-0" />
                <span>
                  {language === 'te'
                    ? 'మీ iPhone హోమ్ స్క్రీన్‌పై గోల్డ్ కాయిన్ ఐకాన్ వస్తుంది. ఒక్క ట్యాప్‌తో నేరుగా ఫుల్‌స్క్రీన్‌లో ఓపెన్ అవుతుంది!'
                    : 'The golden icon appears right on your iPhone home screen with instant fullscreen launch!'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="install-modal-footer">
          <button type="button" className="install-done-btn" onClick={onClose}>
            <span>{language === 'te' ? 'అర్థమైంది (Got It)' : 'Got It'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

