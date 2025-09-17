// src/components/Toolbar.tsx
import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

type Props = {
  onDownload: () => void;
  onCopyLink: () => void;
  link: string | null;
  loading?: boolean;
};

export const Toolbar: React.FC<Props> = ({ onDownload, onCopyLink, link, loading }) => {
  const { lang } = useI18n();
  const isRu = String(lang).toLowerCase().startsWith('ru');

  const TXT = {
    download: isRu ? 'Скачать бриф' : 'Download brief',
    generating: isRu ? 'Генерация…' : 'Generating…',
    copy: isRu ? 'Скопировать' : 'Copy',
    linkLabel: isRu ? 'Ссылка на PDF:' : 'PDF link:',
    noLink: isRu ? 'Ссылки пока нет' : 'No link yet',
  };

  return (
    <div className="toolbar">
      <style>{`
        .toolbar {
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(180px, auto);
          align-items: center;
          margin-top: 16px;
        }
        @media (min-width: 720px) {
          .toolbar {
            grid-template-columns: auto 1fr;
          }
        }

        .btn-primary {
          all: unset;
          cursor: pointer;
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          background: linear-gradient(135deg, #ff8c00, #ff6c00);
          box-shadow: 0 6px 16px rgba(255, 108, 0, 0.25);
          transition: transform .12s ease, box-shadow .2s ease, opacity .2s ease, filter .2s ease;
          border: none;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(255,108,0,.28); }
        .btn-primary:active { transform: translateY(0); box-shadow: 0 6px 16px rgba(255,108,0,.25); }

        .btn-primary[disabled],
        .btn-primary[aria-disabled="true"] {
          cursor: not-allowed;
          opacity: .85;
          filter: grayscale(.15);
          box-shadow: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: spin .8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .link-box {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .link-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #eee;
          background: #fff;
          font-size: 14px;
          color: #222;
        }
        .btn-secondary {
          all: unset;
          cursor: pointer;
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          color: #cc5400;
          background: #fff7f0;
          border: 1px solid #ffd7b3;
          transition: transform .12s ease, box-shadow .2s ease;
        }
        .btn-secondary:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.06); }
        .btn-secondary:active { transform: translateY(0); }

        .label {
          font-size: 12px;
          color: #6b6b6b;
          margin-bottom: -6px;
        }
      `}</style>

      <button
        type="button"
        className="btn-primary"
        onClick={onDownload}
        disabled={!!loading}
        aria-disabled={!!loading}
        aria-busy={!!loading}
      >
        {loading ? <span className="spinner" aria-hidden /> : null}
        <span>{loading ? TXT.generating : TXT.download}</span>
      </button>

      <div>
        <div className="link-box">
          <input
            className="link-input"
            type="text"
            value={link ?? ''}
            placeholder={TXT.noLink}
            readOnly
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={onCopyLink}
            disabled={!link}
            aria-disabled={!link}
            title={TXT.copy}
          >
            {TXT.copy}
          </button>
        </div>
      </div>
    </div>
  );
};
