import React, { useEffect, useState, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
  charSet?: string;
}

const DEFAULT_CHARSET = '0123456789ABCDEF_#-+';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  delay = 0,
  duration = 600,
  className = '',
  onComplete,
  charSet = DEFAULT_CHARSET
}) => {
  const [displayText, setDisplayText] = useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: number;

    timeoutId = window.setTimeout(() => {
      const startTime = performance.now();
      const length = text.length;

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const resolvedChars = Math.floor(progress * length);

        let result = '';
        for (let i = 0; i < length; i++) {
          if (text[i] === ' ') {
            result += ' ';
          } else if (i < resolvedChars) {
            result += text[i];
          } else if (i === resolvedChars) {
            // Front edge character scrambles
            const charIdx = Math.floor(Math.random() * charSet.length);
            result += charSet[charIdx];
          } else {
            // Unresolved characters displayed as subtle placeholder dash or blank
            result += '_';
          }
        }

        setDisplayText(result);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(update);
        } else {
          setDisplayText(text);
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
        }
      };

      animationFrameId = requestAnimationFrame(update);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, delay, duration, charSet, onComplete]);

  return (
    <span className={className} aria-label={text}>
      {displayText || text.replace(/[^ ]/g, '_')}
    </span>
  );
};
