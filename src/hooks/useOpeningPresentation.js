import { useCallback, useEffect, useRef } from 'react';

// DOM and WebGL use the same smoothed sample; never publish frame state to React.
export function useOpeningPresentation(rootRef) {
  const lastSample = useRef(-1);
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.querySelector('.site-header');
    const logo = root?.querySelector('.wordmark');
    if (!header || !logo) return;
    const measure = () => {
      const width = logo.offsetWidth;
      root.style.setProperty('--logo-dx', `${root.clientWidth / 2 - header.offsetLeft - width / 2}px`);
      root.style.setProperty('--logo-dy', `${root.clientHeight / 2 - header.offsetTop - header.offsetHeight / 2}px`);
      root.style.setProperty('--logo-enlarge', String(Math.min(4.2, root.clientWidth * .72 / width) - 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(header);
    observer.observe(logo);
    return () => observer.disconnect();
  }, [rootRef]);
  return useCallback((frame) => {
    const style = rootRef.current?.style;
    if (!style || lastSample.current === frame.progress) return;
    lastSample.current = frame.progress;
    for (const key of ['logo','veil','chrome','cue','landedCaption','takeoffCaption']) {
      style.setProperty(`--opening-${key}`, String(frame[key]));
    }
  }, [rootRef]);
}
