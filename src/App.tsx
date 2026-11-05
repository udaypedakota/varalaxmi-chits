import React, { useState } from 'react';
import { ChitProvider, useChit } from './context/ChitContext';
import { Navbar } from './components/Navbar';
import { MemberDashboard } from './components/MemberDashboard';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { LoginModal } from './components/LoginModal';
import { LotteryWheel } from './components/LotteryWheel';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentRecord, Member } from './types/chit';
import { ShieldCheck, UserCheck, Phone, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, language } = useChit();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{ payment: PaymentRecord; member?: Member | null } | null>(null);

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Container */}
      <main className="main-content-area">
        {currentUser ? (
          currentUser.role === 'organizer' ? (
            <OrganizerDashboard 
              onOpenReceipt={(payment, member) => setActiveReceipt({ payment, member })}
              onOpenLottery={() => setIsLotteryOpen(true)}
            />
          ) : (
            <MemberDashboard 
              onOpenReceipt={(payment) => setActiveReceipt({ payment, member: currentUser })}
              onOpenLottery={() => setIsLotteryOpen(true)}
            />
          )
        ) : (
          /* Unauthenticated Landing / Login Prompt */
          <div className="guest-hero-container animate-fade">
            <div className="guest-card">
              <div className="brand-logo-coin large mx-auto">
                <Sparkles size={36} className="text-yellow-400" />
              </div>
              <h2 className="guest-title">
                {language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ కు స్వాగతం' : 'Welcome to Sri Varalaxmi Chits'}
              </h2>
              <p className="guest-subtitle">
                {language === 'te' 
                  ? '20 నెలల పరస్పర ప్రయోజన చిట్ ఫండ్ పథకం (₹2,00,000)' 
                  : '20-Month Mutual Benefit Chit Fund Scheme (₹2,00,000)'}
              </p>

              <div className="guest-actions-wrap">
                <button 
                  type="button" 
                  className="btn-guest-login member"
                  onClick={() => setIsLoginOpen(true)}
                >
                  <UserCheck size={20} />
                  <span>{language === 'te' ? 'సభ్యునిగా ప్రవేశించండి (Member Login)' : 'Member Login'}</span>
                </button>
                <button 
                  type="button" 
                  className="btn-guest-login organizer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  <ShieldCheck size={20} />
                  <span>{language === 'te' ? 'నిర్వాహకుని లాగిన్ (Organizer Login)' : 'Organizer Login'}</span>
                </button>
              </div>

              <div className="guest-info-box">
                <p>
                  {language === 'te' 
                    ? '📞 ఏవైనా సందేహాలు ఉంటే నిర్వాహకుడు ఫణి (8801147452) గారిని సంప్రదించండి.' 
                    : '📞 For inquiries, contact Chit Organizer Phani at 8801147452.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer no-print">
        <div className="footer-inner">
          <p className="footer-text">
            <strong>శ్రీ వరలక్ష్మి చిట్స్</strong> • ₹2,00,000 పథకం (20 నెలలు • 20 మంది సభ్యులు)
          </p>
          <p className="footer-contact">
            <Phone size={14} /> 
            <span>నిర్వాహకుడు: ఫణి (Phani) • 8801147452 • UPI: 8801147452@ybl</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      <LotteryWheel 
        isOpen={isLotteryOpen} 
        onClose={() => setIsLotteryOpen(false)} 
      />

      <ReceiptModal 
        isOpen={!!activeReceipt}
        payment={activeReceipt?.payment || null}
        member={activeReceipt?.member || null}
        onClose={() => setActiveReceipt(null)}
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
