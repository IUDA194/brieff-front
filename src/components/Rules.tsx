import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export const Rules: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="rules-container">
      <div className="rules-header">
        <div className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="none">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M11 7h2v2h-2zm0 4h2v6h-2z" fill="#fff" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-3.59 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#fff" />
          </svg>
        </div>
        <h2>{t('rules.title')}</h2>
      </div>

      <div className="rules-list">
        <div className="rule-item">
          <div className="rule-number">1</div>
          <div className="rule-text">
            <b className="sub-title">{t('rules.1.subtitle')}</b>
            {t('rules.1.text1')}<br />
            {t('rules.1.text2')}
          </div>
        </div>

        <div className="rule-item">
          <div className="rule-number">2</div>
          <div className="rule-text">
            <b className="sub-title">{t('rules.2.subtitle')}</b>
            {t('rules.2.text1')}<br />
            {t('rules.2.text2')}
          </div>
        </div>

        <div className="rule-item">
          <div className="rule-number">3</div>
          <div className="rule-text">
            <b className="sub-title">{t('rules.3.subtitle')}</b>
            {t('rules.3.text1')}<br />
            {t('rules.3.text2')}
          </div>
        </div>
      </div>

      <svg className="gradient-decor" xmlns="http://www.w3.org/2000/svg" viewBox="-200 -200 800 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6600"/>
            <stop offset="100%" stopColor="#ffcc00"/>
          </linearGradient>
        </defs>
        <path d="M710,-300 C100,280 300,270 600,500" stroke="url(#gradient)" strokeWidth="20" fill="none" strokeLinecap="round"/>
        <path d="M500,600 C200,260 20,530 -300,650" stroke="url(#gradient)" strokeWidth="20" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
};
