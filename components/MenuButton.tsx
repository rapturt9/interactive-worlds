'use client';

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  theme: 'light-parchment' | 'dark-parchment';
}

/**
 * Floating menu button that toggles sidebar and control bar visibility
 * Slides right when sidebar is open, adapts color to theme
 */
export default function MenuButton({ isOpen, onClick, theme }: MenuButtonProps) {
  const isDark = theme === 'dark-parchment';

  return (
    <button
      onClick={onClick}
      className={`fixed top-4 z-50 p-3 backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 border-2 ${
        isDark
          ? 'bg-parchment-tertiary/90 border-white/20 hover:bg-parchment/90'
          : 'bg-parchment hover:bg-parchment-muted border-parchment-primary/20'
      } ${
        isOpen ? 'left-[272px]' : 'left-4'
      }`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      {/* Animated hamburger/X icon */}
      <div className="w-5 h-5 flex flex-col justify-center items-center">
        <span
          className={`block h-[3.5px] w-5 rounded transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
          }`}
          style={{
            backgroundColor: isDark ? 'white' : '#5c4a3a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
        <span
          className={`block h-[3.5px] w-5 rounded transition-all duration-300 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundColor: isDark ? 'white' : '#5c4a3a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
        <span
          className={`block h-[3.5px] w-5 rounded transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1.5'
          }`}
          style={{
            backgroundColor: isDark ? 'white' : '#5c4a3a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </button>
  );
}
