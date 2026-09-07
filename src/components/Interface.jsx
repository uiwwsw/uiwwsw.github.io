import React, { useEffect, useRef, useState } from "react";

export function Icon({ name, size = 18, ...props }) {
  const paths = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    external: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    play: <path d="m9 5 10 7-10 7Z" />,
    sound: (
      <>
        <path d="m11 4-5 4H3v8h3l5 4Z M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
      </>
    ),
    muted: (
      <>
        <path d="m11 4-5 4H3v8h3l5 4Z M16 9l5 6m0-6-5 6" />
      </>
    ),
    star: (
      <>
        <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    github: (
      <>
        <path
          d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.8c3.3-.4 6.7-1.6 6.7-7.3a5.7 5.7 0 0 0-1.5-4 5.2 5.2 0 0 0-.1-4S17.9-.5 15 2a14 14 0 0 0-6 0C6.1-.5 4.9.9 4.9.9a5.2 5.2 0 0 0-.1 4 5.7 5.7 0 0 0-1.5 4c0 5.7 3.4 6.9 6.7 7.3A3.5 3.5 0 0 0 9 19v3"
          transform="translate(0 1) scale(.9)"
        />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.star}
    </svg>
  );
}

export function Panel({ name, title, onClose, children, className = "" }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`panel ${className}`}
      aria-labelledby={`${name}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="panel-shell">
        <div className="panel-top">
          <span className="eyebrow">
            {name === "archive"
              ? "THE STAR ARCHIVE"
              : name === "article"
                ? "A SIGNAL FROM MY UNIVERSE"
                : "THE PERSON BEHIND THE STARS"}
          </span>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <h2 id={`${name}-title`}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function AudioToggle() {
  const [active, setActive] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const audio = useRef(null);
  useEffect(
    () => () => {
      audio.current?.close();
    },
    [],
  );
  async function toggle() {
    try {
      if (!audio.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          setUnavailable(true);
          return;
        }
        const context = new AudioContext();
        audio.current = context;
        const output = context.createGain();
        output.gain.value = 0.035;
        output.connect(context.destination);
        [55, 82.41, 110, 164.81].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.value = 0.7 / (index + 1);
          oscillator.connect(gain).connect(output);
          oscillator.start();
        });
      }
      if (active) await audio.current.suspend();
      else await audio.current.resume();
      setActive(!active);
    } catch {
      setUnavailable(true);
    }
  }
  return (
    <button
      className={`sound-button ${active ? "is-on" : ""}`}
      onClick={toggle}
      aria-pressed={active}
      disabled={unavailable}
      aria-label={
        unavailable
          ? "이 브라우저에서는 소리를 지원하지 않습니다"
          : active
            ? "우주 소리 끄기"
            : "우주 소리 켜기"
      }
    >
      <Icon name={active ? "sound" : "muted"} size={16} />
      <span>
        {unavailable ? "소리 지원 안 됨" : active ? "SOUND ON" : "SOUND OFF"}
      </span>
    </button>
  );
}

export class SceneBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
