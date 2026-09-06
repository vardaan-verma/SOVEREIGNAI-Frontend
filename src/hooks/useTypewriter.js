// Hook: typewriter character-by-character streaming effect
import { useCallback } from 'react';

/**
 * Returns a function that streams markdown text into a target setter,
 * token by token, with adjustable speed.
 */
export function useTypewriter() {
  const stream = useCallback((fullText, onUpdate, onComplete, baseDelayMs = 18) => {
    const tokens = fullText.split(/(\s+|\n+)/);
    let index = 0;
    let accumulated = '';

    function typeNext() {
      if (index < tokens.length) {
        accumulated += tokens[index];
        index++;
        onUpdate(accumulated);
        const delay = tokens[index - 1]?.includes('\n') ? 45 : baseDelayMs;
        setTimeout(typeNext, delay);
      } else {
        onComplete?.();
      }
    }
    typeNext();
  }, []);

  return stream;
}
