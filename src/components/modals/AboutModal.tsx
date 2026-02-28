import React from 'react';
import Modal from './Modal';
import { getVersion, getName } from '@tauri-apps/api/app';

import './Modal.css'
import './AboutModal.css'

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [version, setVersion] = React.useState<string>('...');
  const [appName, setAppName] = React.useState<string>('...');

  React.useEffect(() => {
    if (isOpen) {
      Promise.all([getName(), getVersion()])
        .then(([name, ver]) => {
          setAppName(name);
          setVersion(ver);
        })
        .catch(() => {
          setAppName('StockFlow');
          setVersion('неизвестно');
        });
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="О программе" className='about-modal'>
      <div className="about-modal__content">
        <div className="about-modal__icon-container">
          <div className="about-modal__icon-bg"></div>
          <img src="/icon.svg" alt="App icon" className="about-modal__image" />
        </div>
        
        <div className="about-modal__info">
          <h3 className="about-modal__app-name">{appName}</h3>
          <p className="about-modal__version">Версия {version}</p>
        </div>
        
        <div className="about-modal__description">
          <p>Интеллектуальная система анализа и моделирования запасов для оптимизации складской логистики.</p>
        </div>
        
        <div className="about-modal__footer">
          <p className="about-modal__copyright">© 2026 StockFlow</p>
        </div>
      </div>
    </Modal>
  );
}