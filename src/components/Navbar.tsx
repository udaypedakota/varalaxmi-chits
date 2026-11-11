import React from 'react';
import { useChit } from '../context/ChitContext';
import { LogIn, LogOut, Download } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { GroupSwitcher } from './GroupSwitcher';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenInstall?: () => void;
  isStandalone?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenInstall, isStandalone }) => {
  const { activeGroup, scheme, currentUser, language, logout, dbStatus } = useChit();

  const currentGroup = activeGroup || scheme;

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        {/* Main Row: Brand on Left, User on Right */}
        <div className="navbar-main-row">
          <div className="navbar-brand">
            <div className="brand-logo-coin luxury" aria-label="Varalaxmi Chits Gold Coin">
              <span className="brand-coin-symbol">₹</span>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">
                <span>{language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్' : 'Sri Varalaxmi Chits'}</span>
                {currentUser ? (
                  <span 
                    className="brand-group-pill"
                    title={dbStatus?.isMongoConnected 
                      ? (language === 'te' ? 'క్లౌడ్ డేటాబేస్ కనెక్ట్ అయింది (🟢 Live Atlas Cloud)' : 'Cloud Database Connected (🟢 Live Atlas Cloud)') 
                      : (language === 'te' ? 'డేటాబేస్ ఆఫ్‌లైన్ (🟡 Local Storage Sync)' : 'Database Offline (🟡 Local Storage Sync)')}
                  >
                    <span className={`db-live-dot ${dbStatus?.isMongoConnected ? 'online' : 'offline'}`} />
                    <span>{currentGroup.id === 'grp-2' ? (language === 'te' ? 'గ్రూప్ B' : 'Group B') : (language === 'te' ? 'గ్రూప్ A' : 'Group A')}</span>
                  </span>
                ) : (
                  <span 
                    className={`db-live-dot standalone ${dbStatus?.isMongoConnected ? 'online' : 'offline'}`}
                    title={dbStatus?.isMongoConnected ? 'Live Atlas Cloud' : 'Offline'}
                  />
                )}
              </h1>
              <span className="brand-subtitle">
                {language === 'te' 
                  ? `${currentGroup.totalMonths} నెలల పథకం • ₹${currentGroup.totalValue.toLocaleString('en-IN')}` 
                  : `${currentGroup.totalMonths}-Month Scheme • ₹${currentGroup.totalValue.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* User Info / Login Action */}
          <div className="navbar-user-corner">
            {currentUser ? (
              <div className="user-profile-widget">
                <div className="user-info-text">
                  <span className="user-name">
                    {language === 'te' 
                      ? (currentUser.role === 'organizer' ? 'శివ' : currentUser.nameTe) 
                      : (currentUser.role === 'organizer' ? 'Siva' : currentUser.name)}
                  </span>
                  <span className={`user-role-pill role-${currentUser.role}`}>
                    {currentUser.role === 'organizer' 
                      ? (language === 'te' ? 'ఆర్గనైజర్' : 'Admin')
                      : currentUser.memberNo}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn-icon-logout" 
                  onClick={logout} 
                  title={language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="btn-login-trigger"
                onClick={onOpenLogin}
              >
                <LogIn size={15} />
                <span>{language === 'te' ? 'లాగిన్' : 'Login'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Row: Group Switcher (Organizer) on Left, Language & Notifications on Right */}
        <div className="navbar-sub-row">
          <div className="navbar-sub-left">
            {currentUser?.role === 'organizer' && (
              <GroupSwitcher />
            )}
          </div>

          <div className="navbar-sub-right">
            {onOpenInstall && !isStandalone && (
              <button
                type="button"
                className="navbar-install-pill animate-pulse-subtle"
                onClick={onOpenInstall}
                title={language === 'te' ? 'శ్రీ వరలక్ష్మి చిట్స్ యాప్‌ను ఇన్‌స్టాల్ చేసుకోండి' : 'Install Sri Varalaxmi Chits App'}
              >
                <Download size={13} className="text-amber-400" />
                <span>{language === 'te' ? 'యాప్ ఇన్‌స్టాల్' : 'Install App'}</span>
              </button>
            )}
            <ThemeToggle />
            <LanguageToggle />
            <NotificationDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};
