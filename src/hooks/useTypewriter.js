import { useState, useEffect } from 'react';

export function useTypewriter(text, speed = 60, pause = 3000) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    let timer;

    const type = () => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i <= text.length) {
        timer = setTimeout(type, speed);
      } else {
        timer = setTimeout(() => {
          i = 0;
          type();
        }, pause);
      }
    };

    type();
    return () => clearTimeout(timer);
  }, [text, speed, pause]);

  return displayed;
}
