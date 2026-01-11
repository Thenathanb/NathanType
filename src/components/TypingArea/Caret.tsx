import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface CaretProps {
  left: number;
  top: number;
  height: number;
}

export function Caret({ left, top, height }: CaretProps) {
  const { caretStyle, caretSpeed, smoothCaret } = useSettingsStore();
  const [isVisible, setIsVisible] = useState(true);

  // Blinking animation
  useEffect(() => {
    if (caretStyle === 'off' || caretSpeed === 'off') {
      setIsVisible(true);
      return;
    }

    const speeds = {
      slow: 1000,
      medium: 500,
      fast: 250,
    };

    const interval = setInterval(() => {
      setIsVisible((prev) => !prev);
    }, speeds[caretSpeed as keyof typeof speeds] || 500);

    return () => clearInterval(interval);
  }, [caretStyle, caretSpeed]);

  if (caretStyle === 'off') return null;

  const caretStyles: Record<string, React.CSSProperties> = {
    line: {
      width: '2px',
      height: `${height}px`,
      backgroundColor: 'var(--caret-color)',
    },
    block: {
      width: '0.6em',
      height: `${height}px`,
      backgroundColor: 'var(--caret-color)',
      opacity: 0.5,
    },
    underline: {
      width: '0.6em',
      height: '2px',
      backgroundColor: 'var(--caret-color)',
      top: top + height - 2,
    },
  };

  const style = caretStyles[caretStyle] || caretStyles.line;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}px`,
        top: caretStyle === 'underline' ? `${style.top}px` : `${top}px`,
        width: style.width,
        height: style.height,
        backgroundColor: style.backgroundColor,
        opacity: isVisible ? (style.opacity || 1) : 0,
        transition: smoothCaret ? 'left 0.1s ease-out, top 0.1s ease-out' : 'none',
      }}
    />
  );
}
