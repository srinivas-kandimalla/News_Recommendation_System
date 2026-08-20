import { useEffect, useState } from 'react';

/**
 * ReadingProgress — thin 2px cyan line at very top of viewport
 * showing how far down the article the user has scrolled.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { setProgress(100); return; }
      setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      id="signal-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Reading progress"
      style={{ width: `${progress}%` }}
    />
  );
}
