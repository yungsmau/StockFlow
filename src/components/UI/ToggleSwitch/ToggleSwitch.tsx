import './ToggleSwitch.css';

interface ToggleSwitchProps {
  className?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  title?: string;
}

export default function ToggleSwitch({
  className,
  enabled,
  onChange,
  disabled = false,
  title
}: ToggleSwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!enabled);
    }
  };

  return (
    <button
      className={`toggle-switch ${enabled ? 'toggle-switch--on' : ''} ${disabled ? 'toggle-switch--disabled' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={enabled}
      aria-disabled={disabled}
      title={title}
      type="button"
    >
      <span className="toggle-switch__track">
        <span className="toggle-switch__thumb" />
      </span>
    </button>
  );
}