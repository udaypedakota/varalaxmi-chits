import React, { useState, useEffect } from 'react';
import { useChit } from '../context/ChitContext';
import { 
  ArrowLeft, Lock, Phone, ShieldCheck, UserCheck, AlertCircle, 
  ArrowRight, Eye, EyeOff, CheckCircle2, Info 
} from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'member' | 'organizer';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialTab = 'member' }) => {
  const { login, language } = useChit();

  const [activeTab, setActiveTab] = useState<'member' | 'organizer'>(initialTab);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const resetForms = () => {
    setPhone('');
    setPin('');
    setError('');
    setSuccessMsg('');
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    let cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError(language === 'te' ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError(language === 'te' ? 'దయచేసి మీ 4-అంకెల సెక్యూరిటీ పిన్ నమోదు చేయండి' : 'Please enter your 4-digit security PIN');
      return;
    }

    const res = await login(cleanPhone, pin.trim(), 'member');
    if (res.success) {
      setSuccessMsg(language === 'te' ? 'లాగిన్ విజయవంతమైంది!' : 'Login successful!');
      setTimeout(() => {
        resetForms();
        onClose();
      }, 350);
    } else {
      setError(res.error || (language === 'te' ? 'లాగిన్ విఫలమైంది' : 'Login failed'));
    }
  };

  const handleOrganizerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    let cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError(language === 'te' ? 'ఆర్గనైజర్ 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter 10-digit organizer mobile');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError(language === 'te' ? 'దయచేసి ఆర్గనైజర్ 4-అంకెల పిన్ నమోదు చేయండి' : 'Enter 4-digit organizer PIN');
      return;
    }

    const res = await login(cleanPhone, pin.trim(), 'organizer');
    if (res.success) {
      setSuccessMsg(language === 'te' ? 'ఆర్గనైజర్ పోర్టల్ లోకి స్వాగతం!' : 'Welcome to Organizer Portal!');
      setTimeout(() => {
        resetForms();
        onClose();
      }, 350);
    } else {
      setError(
        language === 'te'
          ? 'ఆర్గనైజర్ ఆధారాలు సరిపోలలేదు. దయచేసి సరైన మొబైల్ & పిన్ నమోదు చేయండి.'
          : 'Invalid organizer credentials. Please enter correct mobile number and PIN.'
      );
    }
  };

  return (
    <div className="login-screen-overlay animate-fade" onClick={onClose}>
      <div className="login-mobile-frame animate-scale-up" onClick={e => e.stopPropagation()}>
        {/* Top Header Bar matching reference layout */}
        <header className="login-frame-top-bar">
          <button 
            type="button" 
            className={`login-back-btn ${language === 'te' ? 'is-te' : 'is-en'}`}
            onClick={onClose}
            aria-label={language === 'te' ? 'వెనుకకు' : 'Back'}
          >
            <ArrowLeft size={16} className="login-back-icon shrink-0" />
            <span className="login-back-title">{language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్' : 'Sri Varalaxmi Chits'}</span>
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* Ambient Glows */}
        <div className="login-ambient-glow"></div>

        {/* Floating Luxury Gold Sheet Card (Gold Theme as requested) */}
        <div className="login-gold-sheet-card">
          {/* Center Overlapping 3D Gold Rupee Coin at top */}
          <div className="sheet-floating-gold-coin">
            <span>₹</span>
          </div>

          {/* Title & Subtitle */}
          <div className="sheet-header text-center">
            <h2 className="sheet-title">
              {activeTab === 'member'
                ? (language === 'te' ? 'సభ్యుల లాగిన్' : 'Member Login')
                : (language === 'te' ? 'ఆర్గనైజర్ లాగిన్' : 'Organizer Login')}
            </h2>
            <p className="sheet-subtitle">
              {activeTab === 'member'
                ? (language === 'te' ? 'మీ పాస్‌బుక్ & డిజిటల్ రసీదులను చూడండి' : 'Access your Passbook & Digital Receipts')
                : (language === 'te' ? 'నిర్వాహకుని నియంత్రణ కేంద్రం (శివ)' : 'Administer Chits & Approve Payments')}
            </p>
          </div>

          {/* Segmented Switch: Member Portal vs Organizer Portal */}
          <div className="sheet-segmented-tabs">
            <button
              type="button"
              className={`sheet-segment-btn ${activeTab === 'member' ? 'active' : ''}`}
              onClick={() => { setActiveTab('member'); resetForms(); }}
            >
              <UserCheck size={16} />
              <span>{language === 'te' ? 'సభ్యుల పోర్టల్' : 'Member Portal'}</span>
            </button>
            <button
              type="button"
              className={`sheet-segment-btn ${activeTab === 'organizer' ? 'active' : ''}`}
              onClick={() => { setActiveTab('organizer'); resetForms(); }}
            >
              <ShieldCheck size={16} />
              <span>{language === 'te' ? 'ఆర్గనైజర్ పోర్టల్' : 'Organizer Portal'}</span>
            </button>
          </div>

          {/* Alerts */}
          {successMsg && (
            <div className="sheet-alert-success animate-bounce-short">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="sheet-alert-error animate-bounce-short">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={activeTab === 'member' ? handleMemberLogin : handleOrganizerLogin} className="sheet-form">
            <div className="sheet-field">
              <label className="sheet-label">
                <Phone size={14} className="text-amber-400" />
                <span>
                  {activeTab === 'member' 
                    ? (language === 'te' ? 'రిజిస్టర్డ్ మొబైల్ నంబర్' : 'Registered Mobile Number')
                    : (language === 'te' ? 'ఆర్గనైజర్ మొబైల్ నంబర్' : 'Organizer Mobile Number')}
                </span>
              </label>
              <div className="sheet-input-group">
                <span className="sheet-prefix">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className="sheet-input"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="sheet-field">
              <label className="sheet-label">
                <Lock size={14} className="text-amber-400" />
                <span>
                  {activeTab === 'member'
                    ? (language === 'te' ? '4-అంకెల సెక్యూరిటీ పిన్' : '4-Digit Security PIN')
                    : (language === 'te' ? 'ఆర్గనైజర్ సెక్యూరిటీ పిన్' : 'Organizer Security PIN')}
                </span>
              </label>
              <div className="sheet-pin-input-wrap">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  className="sheet-input pin-input"
                  placeholder="••••"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <button
                  type="button"
                  className="sheet-pin-eye-btn"
                  onClick={() => setShowPin(!showPin)}
                  tabIndex={-1}
                  title={showPin ? (language === 'te' ? 'పిన్ దాచు' : 'Hide PIN') : (language === 'te' ? 'పిన్ చూపించు' : 'Show PIN')}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="sheet-submit-btn">
              <span>
                {activeTab === 'member'
                  ? (language === 'te' ? 'పాస్‌బుక్ చూడండి (Access Passbook)' : 'Access Passbook')
                  : (language === 'te' ? 'ఆర్గనైజర్ సెంటర్ లోకి ప్రవేశించండి' : 'Access Organizer Center')}
              </span>
              <ArrowRight size={18} />
            </button>

            {/* Informative Note Box at bottom of sheet */}
            <div className="sheet-note-box">
              <Info size={15} className="sheet-note-icon shrink-0" />
              <p>
                {language === 'te'
                  ? 'గమనిక: సభ్యుల ఖాతాలు మరియు లాగిన్ పిన్‌లు ఆర్గనైజర్ శివ (8790859546) గారిచే కేటాయించబడతాయి.'
                  : 'Note: Member accounts and PINs are assigned by Organizer Siva (8790859546).'}
              </p>
            </div>
          </form>
        </div>

        {/* Bottom Golden Wave Ribbons */}
        <div className="login-bottom-waves">
          <img src="/gold-wave-ribbons.svg" alt="Gold Waves" className="waves-svg-img" />
        </div>
      </div>
    </div>
  );
};
