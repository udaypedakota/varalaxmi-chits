import React from 'react';
import { useChit } from '../context/ChitContext';
import { LogIn, LogOut, Globe, Sparkles } from 'lucide-react';

export const Navbar: React.FC<{ onOpenLogin: () => void }> = ({ onOpenLogin }) => {
  const { scheme, currentUser, language, setLanguage, logout } = useChit();

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand">
          <div className="brand-logo-coin">
            <Sparkles size={22} className="coin-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">
              {language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్' : 'Sri Varalaxmi Chits'}
            </h1>
            <span className="brand-subtitle">
              {language === 'te' 
                ? '20 నెలల పథకం • ₹2,00,000' 
                : '20-Month Mutual Scheme • ₹2,00,000'}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="navbar-actions">
          {/* Current Scheme Month Pill */}
          <div className="current-month-badge">
            <span className="month-dot"></span>
            <span className="month-text">
              {language === 'te' 
                ? `నెల ${scheme.currentMonth} / 20` 
                : `Month ${scheme.currentMonth} of 20`}
            </span>
          </div>

          {/* Language Switcher */}
          <button 
            type="button" 
            className="lang-toggle-btn"
            onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
            title="భాష మార్చండి / Change Language"
          >
            <Globe size={16} />
            <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>

          {/* User Info / Login Action */}
          {currentUser ? (
            <div className="user-profile-widget">
              <div className="user-info-text">
                <span className="user-name">
                  {language === 'te' ? currentUser.nameTe : currentUser.name}
                </span>
                <span className={`user-role-pill role-${currentUser.role}`}>
                  {currentUser.role === 'organizer' 
                    ? (language === 'te' ? 'ఆర్గనైజర్' : 'Organizer')
                    : (language === 'te' ? `సభ్యుడు #${currentUser.memberNo}` : `Member #${currentUser.memberNo}`)}
                </span>
              </div>
              <button 
                type="button" 
                className="btn-icon-logout" 
                onClick={logout} 
                title={language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-login-trigger"
              onClick={onOpenLogin}
            >
              <LogIn size={16} />
              <span>{language === 'te' ? 'లాగిన్' : 'Login'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
