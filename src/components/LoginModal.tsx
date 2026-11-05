import React, { useState } from 'react';
import { useChit } from '../context/ChitContext';
import { X, Lock, Phone, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, members, switchUser, language } = useChit();

  const [activeTab, setActiveTab] = useState<'member' | 'organizer'>('member');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.trim().length !== 10) {
      setError(language === 'te' ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter valid 10-digit mobile number');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError(language === 'te' ? 'దయచేసి 4 అంకెల సెక్యూరిటీ పిన్ నమోదు చేయండి' : 'Please enter 4-digit security PIN');
      return;
    }

    const success = login(phone.trim(), pin.trim());
    if (success) {
      onClose();
    } else {
      setError(language === 'te' ? 'మొబైల్ నంబర్ లేదా పిన్ తప్పుగా ఉంది. దయచేసి సరిచూసుకోండి' : 'Invalid mobile number or PIN. Please check again.');
    }
  };

  const handleQuickLogin = (memberId: string) => {
    switchUser(memberId);
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="login-modal-card" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="login-header text-center">
          <div className="brand-logo-coin large mx-auto">
            <span>₹</span>
          </div>
          <h2 className="login-title">
            {language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ లాగిన్' : 'Sri Varalaxmi Chits Login'}
          </h2>
          <p className="login-subtitle">
            {language === 'te' 
              ? 'మీ చిట్ ఖాతా వివరాలు మరియు రసీదులు వీక్షించండి' 
              : 'Access your chit fund passbook & digital receipts'}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'member' ? 'active' : ''}`}
            onClick={() => { setActiveTab('member'); setError(''); }}
          >
            <UserCheck size={18} />
            <span>{language === 'te' ? 'సభ్యుని లాగిన్' : 'Member Login'}</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'organizer' ? 'active' : ''}`}
            onClick={() => { setActiveTab('organizer'); setError(''); }}
          >
            <ShieldCheck size={18} />
            <span>{language === 'te' ? 'నిర్వాహకుని లాగిన్' : 'Organizer Login'}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label className="field-label">
              <Phone size={15} />
              <span>{language === 'te' ? 'రిజిస్టర్డ్ మొబైల్ నంబర్' : 'Registered Mobile Number'}</span>
            </label>
            <div className="input-group">
              <span className="input-prefix">+91</span>
              <input
                type="tel"
                maxLength={10}
                className="form-input"
                placeholder="10-digit number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              <Lock size={15} />
              <span>{language === 'te' ? '4-అంకెల సెక్యూరిటీ పిన్ (Default: 1234)' : '4-Digit Security PIN (Default: 1234)'}</span>
            </label>
            <input
              type="password"
              maxLength={4}
              className="form-input text-center tracking-widest text-lg font-bold"
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button type="submit" className="btn-primary w-full login-btn">
            <span>{language === 'te' ? 'ఖాతాలోకి ప్రవేశించండి' : 'Secure Login'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* 1-Click Fast Demo Switcher */}
        <div className="demo-accounts-box">
          <span className="demo-box-title">
            ⚡ {language === 'te' ? '1-క్లిక్ డెమో లాగిన్ (పరీక్షించడానికి):' : '1-Click Fast Demo Logins:'}
          </span>
          <div className="demo-buttons-grid">
            {activeTab === 'organizer' ? (
              <button
                type="button"
                className="btn-demo-pill organizer"
                onClick={() => handleQuickLogin('m-01')}
              >
                👑 <strong>ఫణి (ఆర్గనైజర్)</strong> • 8801147452
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => handleQuickLogin('m-02')}
                >
                  👤 <strong>ఉదయ్ (నెల 2 చిట్ ఎత్తారు)</strong>
                </button>
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => handleQuickLogin('m-03')}
                >
                  👤 <strong>సురేష్ కుమార్ (యాక్టివ్ మెంబర్)</strong>
                </button>
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => handleQuickLogin('m-04')}
                >
                  👤 <strong>రమేష్ నాయుడు (పెండింగ్)</strong>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
