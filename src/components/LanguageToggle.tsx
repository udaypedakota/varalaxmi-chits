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
      {showIcon && <Globe size={15} className="lang-globe-icon" />}
      <button
        type="button"
        className={`lang-option-pill ${language === 'te' ? 'active' : ''}`}
        onClick={() => setLanguage('te')}
        title="తెలుగు భాషను ఎంచుకోండి"
        aria-pressed={language === 'te'}
      >
        తెలుగు
      </button>
      <button
        type="button"
        className={`lang-option-pill ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="Switch to English"
        aria-pressed={language === 'en'}
      >
        English
      </button>
    </div>
  );
};

