import { useState, useEffect } from 'react';

/**
 * Hook to rotate through an array of messages at a specified interval
 * @param messages - Array of messages to rotate through
 * @param interval - Time in milliseconds between rotations (default: 2500ms)
 * @returns Current message to display
 */
export function useRotatingMessages(
  messages: string[],
  interval: number = 2500
): string {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return messages[currentIndex] || messages[0] || '';
}
