import { open } from '@tauri-apps/plugin-shell';
import Modal from './Modal';
import './Modal.css'
import './NotificationModal.css'

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateNotification: {
    newVersion: string;
    isMajorUpdate: boolean;
    releaseNotes?: string;
    downloadUrl: string;
  } | null;
}

export default function NotificationsModal({ 
  isOpen, 
  onClose,
  updateNotification 
}: NotificationsModalProps) {
  if (!updateNotification) {
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
        <div className={`notifications-modal__update ${updateNotification.isMajorUpdate ? 'notifications-modal__update--major' : ''}`}>
          <h4 className="notifications-modal__update-title">
            Доступно обновление v{updateNotification.newVersion}
          </h4>
          {updateNotification.isMajorUpdate && (
            <span className="notifications-modal__update-badge">Важно!</span>
          )}
          {updateNotification.releaseNotes && (
            <p className="notifications-modal__update-notes">
              {updateNotification.releaseNotes}
            </p>
          )}
          <button
            className="notifications-modal__update-link"
            onClick={() => open(updateNotification.downloadUrl.trim())}
          >
            Скачать обновление
          </button>
          {updateNotification.isMajorUpdate && (
            <p className="notifications-modal__update-warning">
              Загрузка файлов временно недоступна до обновления.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}