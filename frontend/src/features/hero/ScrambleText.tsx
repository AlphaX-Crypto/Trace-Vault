import React, { useEffect, useState, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

const CIPHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  delay = 0,
  duration = 500,
  className = '',
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    const timeoutId = window.setTimeout(() => {
      const startTime = performance.now();
      const length = text.length;

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const resolvedChars = Math.floor(progress * length);

        let result = '';
        for (let i = 0; i < length; i++) {
          if (text[i] === ' ' || text[i] === '/' || text[i] === '-') {
            result += text[i];
          } else if (i < resolvedChars) {
            result += text[i];
          } else if (i <= resolvedChars + 1 && progress < 1) {
            // Front edge character scrambles softly
            const charIdx = Math.floor(Math.random() * CIPHER_CHARS.length);
            result += CIPHER_CHARS[charIdx];
          } else {
            // Unresolved characters rendered from original text at low opacity via CSS or subtle cipher
            result += text[i];
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
  }, [text, delay, duration, onComplete]);

  return (
    <span className={className} aria-label={text}>
      {displayText || text}
    </span>
  );
};
