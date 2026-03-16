interface HistoryDeleteModalProps {
  isOpen: boolean;
  selectedIdsCount: number;
  isClearing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function HistoryDeleteModal({
  isOpen,
  isClearing,
  onClose,
  onConfirm
}: HistoryDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="history-confirm-overlay" onClick={onClose}>
      <div className="history-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Подтвердите удаление</h3>
        <p>
          Вы уверены, что хотите удалить выбранные записи?
          Это действие нельзя отменить.
        </p>
        <div className="history-confirm-buttons">
          <button className="history-confirm-cancel" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="history-confirm-confirm" 
            onClick={onConfirm}
            disabled={isClearing}
          >
            {isClearing ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}