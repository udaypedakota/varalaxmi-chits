import React from 'react';
import { useChit } from '../context/ChitContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', showIcon = true }) => {
  const { language, setLanguage } = useChit();

  return (
    <div className={`lang-segmented-switch ${className}`} role="group" aria-label="Language selection">
      {showIcon && <Globe size={13} className="lang-globe-icon" />}
      <button
        type="button"
        className={`lang-option-pill pill-te ${language === 'te' ? 'active' : ''}`}
        onClick={() => setLanguage('te')}
        title="తెలుగు భాషను ఎంచుకోండి (Telugu)"
        aria-pressed={language === 'te'}
      >
        తె
      </button>
      <button
        type="button"
        className={`lang-option-pill pill-en ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="Switch to English"
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  );
};

