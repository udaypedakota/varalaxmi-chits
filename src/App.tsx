import React, { useState, useEffect } from 'react';
import { ChitProvider, useChit } from './context/ChitContext';
import { Navbar } from './components/Navbar';
import { MemberDashboard } from './components/MemberDashboard';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { LoginModal } from './components/LoginModal';
import { LotteryWheel } from './components/LotteryWheel';
import { ReceiptModal } from './components/ReceiptModal';
import { MobileNotificationToast } from './components/MobileNotificationToast';
import { InstallAppModal } from './components/InstallAppModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { LanguageToggle } from './components/LanguageToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { PaymentRecord, Member } from './types/chit';
import { ShieldCheck, UserCheck, Phone, ChevronRight, Sparkles, Download } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, language, activeGroup, scheme } = useChit();
  const currentGroup = activeGroup || scheme;

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'member' | 'organizer'>('member');
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{ payment: PaymentRecord; member?: Member | null } | null>(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };
    checkStandalone();
    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  const openMemberLogin = () => {
    setLoginModalTab('member');
    setIsLoginOpen(true);
  };

  const openOrganizerLogin = () => {
    setLoginModalTab('organizer');
    setIsLoginOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Floating Push Notification Banner (Mobile App style) */}
      <MobileNotificationToast />

      {/* Automatic PWA Install Floating Banner (Android & iPhone) */}
      <InstallAppBanner 
        onOpenModal={() => setIsInstallModalOpen(true)}
        deferredPrompt={deferredPrompt}
        setDeferredPrompt={setDeferredPrompt}
      />

      {/* CONDITIONAL RENDERING:
          When user is logged in -> Render Full Navbar & Member / Organizer Dashboard.
          When user is unauthenticated -> Render ONLY the standalone ultra-luxury Welcome Screen matching the reference design! */}
      {currentUser ? (
        <>
          <Navbar 
            onOpenLogin={openMemberLogin} 
            onOpenInstall={() => setIsInstallModalOpen(true)}
            isStandalone={isStandalone}
          />
          <main className="main-content-area">
            {currentUser.role === 'organizer' ? (
              <OrganizerDashboard 
                onOpenReceipt={(payment, member) => setActiveReceipt({ payment, member })}
                onOpenLottery={() => setIsLotteryOpen(true)}
              />
            ) : (
              <MemberDashboard 
                onOpenReceipt={(payment) => setActiveReceipt({ payment, member: currentUser })}
              />
            )}
          </main>
          <footer className="app-footer no-print">
            <div className="footer-inner">
              <p className="footer-text">
                <strong>{language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్' : 'Sri Varalaxmi Chits'}</strong> • {language === 'te' ? '₹2,00,000 పథకం (20 నెలలు • 20 మంది సభ్యులు)' : '₹2,00,000 Scheme (20 Months • 20 Members)'}
              </p>
              <p className="footer-contact">
                <Phone size={14} /> 
                <span>{language === 'te' ? 'నిర్వాహకుడు: శివ (Siva) • 8790859546 • UPI: 8790859546@ybl' : 'Organizer: Siva • 8790859546 • UPI: 8790859546@ybl'}</span>
              </p>
            </div>
          </footer>
        </>
      ) : (
        /* Standalone Unauthenticated Welcome Screen matching reference image */
        <div className="landing-viewport-wrap animate-fade">
          <div className="landing-mobile-frame">
            {/* Ambient Gold Aura */}
            <div className="landing-ambient-glow center"></div>

            {/* Top Language Bar & Optional Install Pill (No Group Name before login) */}
            <header className="landing-header-row">
              {!isStandalone && (
                <button
                  type="button"
                  className="landing-install-pill animate-pulse-subtle"
                  onClick={() => setIsInstallModalOpen(true)}
                  title={language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ యాప్‌ను ఇన్‌స్టాల్ చేసుకోండి' : 'Install Sri Varalaxmi Chits App'}
                >
                  <Download size={13} className="text-amber-400" />
                  <span>{language === 'te' ? 'యాప్ ఇన్‌స్టాల్' : 'Install App'}</span>
                </button>
              )}
              <div className="landing-header-spacer"></div>
              <ThemeToggle />
              <LanguageToggle />
            </header>

            {/* Upper Flowing Golden Ribbons in Background */}
            <div className="landing-top-waves">
              <img src="/gold-wave-ribbons.svg" alt="" className="waves-svg-top" />
            </div>

            {/* Main Stage: Vertically balanced and elevated so content is never pushed to the bottom */}
            <div className="landing-main-stage">
              {/* 3D Golden Kalash Artwork (Seamless Transparent PNG, No Box) */}
              <div className="landing-art-container">
                <div className="art-aura-glow"></div>
                <img 
                  src="/kalash-3d.png" 
                  alt="Sri Varalaxmi 3D Kalash, Lotus & Gold Coins" 
                  className="landing-kalash-3d-img"
                />
              </div>

              {/* Center Typography & CTA Section */}
              <div className="landing-content-box">
                <h1 className="landing-hero-heading">
                  {language === 'te' ? (
                    <>శ్రీ వరలక్ష్మి చిట్స్ కు<br />స్వాగతం</>
                  ) : (
                    <>Welcome to<br />Sri Varalaxmi Chits</>
                  )}
                </h1>
                <p className="landing-hero-caption">
                  {language === 'te' ? (
                    <>20 నెలల పరస్పర ప్రయోజన<br />చిట్ ఫండ్ పథకం (₹2,00,000)</>
                  ) : (
                    <>20-Month Mutual Benefit<br />Chit Fund Scheme (₹2,00,000)</>
                  )}
                </p>

                {/* 2 Primary CTA Buttons */}
                <div className="landing-actions-col">
                  <button 
                    type="button" 
                    className="btn-landing-member"
                    onClick={openMemberLogin}
                  >
                    <div className="btn-inner-left">
                      <UserCheck size={20} className="btn-icon" />
                      <span className="btn-label">{language === 'te' ? 'సభ్యుల లాగిన్' : 'Member Login'}</span>
                    </div>
                    <ChevronRight size={20} className="btn-chevron" />
                  </button>

                  <button 
                    type="button" 
                    className="btn-landing-organizer"
                    onClick={openOrganizerLogin}
                  >
                    <div className="btn-inner-left">
                      <ShieldCheck size={20} className="btn-icon" />
                      <span className="btn-label">{language === 'te' ? 'ఆర్గనైజర్ లాగిన్' : 'Organizer Login'}</span>
                    </div>
                    <ChevronRight size={20} className="btn-chevron text-amber-400" />
                  </button>
                </div>

                {/* Carousel Pagination Dots */}
                <div className="landing-carousel-dots">
                  <span className="dot-active-pill"></span>
                  <span className="dot-inactive-circle"></span>
                  <span className="dot-inactive-circle"></span>
                </div>

                {/* Footer Phone Notice */}
                <div className="landing-footer-note">
                  <Phone size={13} className="text-amber-400 shrink-0" />
                  <span>
                    {language === 'te' 
                      ? 'వివరాలకు సంప్రదించండి: చిట్ నిర్వాహకుడు శివ (8790859546)' 
                      : 'For inquiries, contact Chit Organizer Siva at 8790859546.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Golden Wave Ribbons */}
            <div className="landing-bottom-waves">
              <img src="/gold-wave-ribbons.svg" alt="Gold Waves" className="waves-svg-img" />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        initialTab={loginModalTab}
      />

      <LotteryWheel 
        isOpen={isLotteryOpen} 
        onClose={() => setIsLotteryOpen(false)} 
      />

      {activeReceipt && (
        <ReceiptModal 
          isOpen={true} 
          onClose={() => setActiveReceipt(null)} 
          payment={activeReceipt.payment} 
          member={activeReceipt.member || undefined} 
        />
      )}

      {/* PWA Install Guide Modal (iPhone & Android) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
};

export default function App() {
  return (
    <ChitProvider>
      <AppContent />
    </ChitProvider>
  );
}
