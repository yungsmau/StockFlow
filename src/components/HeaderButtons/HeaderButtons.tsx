import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './HeaderButtons.css';
import ToggleSwitch from '../UI/ToggleSwitch/ToggleSwitch';

interface HeaderButtonsProps {
  onHelpClick: () => void;
  onNotificationsClick: () => void;
  onAboutClick: () => void;
  onBackClick?: () => void; 
  hasUpdate?: boolean;
  isMajorUpdate?: boolean;
}

interface HeaderButtonProps {
  onClick?: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ 
  onClick, 
  title, 
  className = '',
  children 
}) => (
  <button 
    className={`header-button ${className}`.trim()}
    onClick={onClick}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

export default function HeaderButtons({ 
  onHelpClick, 
  onNotificationsClick, 
  onAboutClick,
  onBackClick, 
  hasUpdate,
  isMajorUpdate
}: HeaderButtonsProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="header-buttons">
      {onBackClick && (
        <HeaderButton 
          title="Назад к загрузке" 
          className="back-button"
          onClick={onBackClick}
        >
          <span>Назад</span>
        </HeaderButton>
      )}

      <HeaderButton 
        title="Справка" 
        className="help-button"
        onClick={onHelpClick}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_3_1535)">
            <path
              d="M7.57496 7.50002C7.77088 6.94308 8.15759 6.47344 8.66659 6.1743C9.17559 5.87515 9.77404 5.7658 10.3559 5.86561C10.9378 5.96542 11.4656 6.26796 11.8459 6.71963C12.2261 7.1713 12.4342 7.74296 12.4333 8.33335C12.4333 10 9.93329 10.8334 9.93329 10.8334M9.99996 14.1667H10.0083M18.3333 10C18.3333 14.6024 14.6023 18.3334 9.99996 18.3334C5.39759 18.3334 1.66663 14.6024 1.66663 10C1.66663 5.39765 5.39759 1.66669 9.99996 1.66669C14.6023 1.66669 18.3333 5.39765 18.3333 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_3_1535">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </HeaderButton>

      <HeaderButton 
        title="Уведомления" 
        className="notifications-button"
        onClick={onNotificationsClick}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_3_1501)">
            <path
              d="M17.6825 15.8492L16.5 14.6667V10.0834C16.5 7.26919 14.9967 4.91335 12.375 4.29002V3.66669C12.375 2.90585 11.7609 2.29169 11 2.29169C10.2392 2.29169 9.62505 2.90585 9.62505 3.66669V4.29002C6.99421 4.91335 5.50005 7.26002 5.50005 10.0834V14.6667L4.31755 15.8492C3.74005 16.4267 4.14338 17.4167 4.95921 17.4167H17.0317C17.8567 17.4167 18.26 16.4267 17.6825 15.8492ZM14.6667 15.5834H7.33338V10.0834C7.33338 7.81002 8.71755 5.95835 11 5.95835C13.2825 5.95835 14.6667 7.81002 14.6667 10.0834V15.5834ZM11 20.1667C12.0084 20.1667 12.8334 19.3417 12.8334 18.3334H9.16671C9.16671 19.3417 9.98255 20.1667 11 20.1667Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath id="clip0_3_1501">
              <rect width="22" height="22" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        {hasUpdate && (
          <span 
            className={`notification-indicator ${
              isMajorUpdate ? 'notification-indicator--major' : 'notification-indicator--minor'
            }`}
          />
        )}
      </HeaderButton>

      <HeaderButton 
        title="О программе" 
        className="about-button"
        onClick={onAboutClick}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_3_1506)">
            <path
              d="M9.16669 5.83335H10.8334V7.50002H9.16669V5.83335ZM10 14.1667C10.4584 14.1667 10.8334 13.7917 10.8334 13.3334V10C10.8334 9.54169 10.4584 9.16669 10 9.16669C9.54169 9.16669 9.16669 9.54169 9.16669 10V13.3334C9.16669 13.7917 9.54169 14.1667 10 14.1667ZM10 1.66669C5.40002 1.66669 1.66669 5.40002 1.66669 10C1.66669 14.6 5.40002 18.3334 10 18.3334C14.6 18.3334 18.3334 14.6 18.3334 10C18.3334 5.40002 14.6 1.66669 10 1.66669ZM10 16.6667C6.32502 16.6667 3.33335 13.675 3.33335 10C3.33335 6.32502 6.32502 3.33335 10 3.33335C13.675 3.33335 16.6667 6.32502 16.6667 10C16.6667 13.675 13.675 16.6667 10 16.6667Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath id="clip0_3_1506">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </HeaderButton>

      {/* ✅ ToggleSwitch для переключения темы с иконками внутри thumb */}
      <div className="header-buttons__theme-toggle">
        <ToggleSwitch
          className='header-buttons__theme-thumb'
          enabled={theme === 'dark'}
          onChange={toggleTheme}
          title={theme === 'dark' ? "Переключить на светлую тему" : "Переключить на темную тему"}
        />
      </div>
    </div>
  );
}