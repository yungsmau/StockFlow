import { openUrl } from '@tauri-apps/plugin-opener'; 
import Modal from '../Modal';
import '../Modal.css';
import './NotificationModal.css';
import { useUpdateCheck } from '../../../hooks/useUpdateCheck';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ 
  isOpen, 
  onClose 
}: NotificationsModalProps) {
  const { 
    update, 
    downloading, 
    downloadProgress, 
    readyToInstall, 
    installing,
    downloadUpdate, 
    installUpdate, 
    cancelUpdate,
  } = useUpdateCheck();

  if (!update) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Уведомления" className="notifications-modal">
        <div className="notifications-modal__content">
          <p className="notifications-modal__empty">Нет новых уведомлений</p>
          <p className="notifications-modal__info">
            Когда появятся обновления или важные сообщения, они будут отображаться здесь.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Уведомления" className="notifications-modal">
      <div className="notifications-modal__content">
        <div className={`notifications-modal__update ${update.isMajorUpdate ? 'notifications-modal__update--major' : ''}`}>
          <h4 className="notifications-modal__update-title">
            Доступно обновление v{update.newVersion}
            {update.isMajorUpdate && (
              <span className="notifications-modal__update-badge">Важно</span>
            )}
          </h4>

          {/* Состояние 1: Кнопки загрузки */}
          {!downloading && !readyToInstall && !installing && (
            <>
              <p className="notifications-modal__update-description">
                Новая версия готова к загрузке. Приложение перезапустится после установки.
              </p>
              
              {/* Автозагрузка */}
              <button
                className="notifications-modal__update-button notifications-modal__update-button--primary"
                onClick={downloadUpdate}
              >
                Скачать автоматически
              </button>
              
              {/* Ручная загрузка (с openUrl) */}
              <button
                className="notifications-modal__update-button notifications-modal__update-button--secondary"
                onClick={async () => {
                  try {
                    await openUrl(update.downloadUrl.trim());
                  } catch (err) {
                    alert('Не удалось открыть страницу репозитория');
                  }
                }}
              >
                Скачать вручную
              </button>
            </>
          )}

          {/* Состояние 2: Прогресс загрузки */}
          {downloading && !readyToInstall && (
            <div className="notifications-modal__download-progress">
              <div className="progress-bar">
                <div 
                  className="progress-bar__fill" 
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="progress-bar__text">Загрузка: {downloadProgress}%</p>
              <button
                className="notifications-modal__update-button notifications-modal__update-button--cancel"
                onClick={cancelUpdate}
                disabled={installing}
              >
                Отмена
              </button>
            </div>
          )}

          {/* Состояние 3: Готово к установке */}
          {readyToInstall && !installing && (
            <>
              <div className="notifications-modal__ready-message">
                <svg className="ready-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#22c55e" strokeWidth="2"/>
                  <path d="M8 12L11 15L16 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Обновление загружено и готово к установке!</span>
              </div>
              <div className="notifications-modal__update-actions">
                <button
                  className="notifications-modal__update-button notifications-modal__update-button--primary"
                  onClick={installUpdate}
                >
                  Установить и перезапустить
                </button>
                <button
                  className="notifications-modal__update-button notifications-modal__update-button--secondary"
                  onClick={cancelUpdate}
                >
                  Позже
                </button>
              </div>
            </>
          )}

          {/* Состояние 4: Установка */}
          {installing && (
            <div className="notifications-modal__installing">
              <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="60" strokeDashoffset="20"/>
              </svg>
              <p>Установка обновления...</p>
              <p className="installing-note">Приложение перезапустится автоматически</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}