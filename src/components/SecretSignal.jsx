import React, { useEffect, useRef } from "react";
import { Icon } from "./Interface";
import "./SecretSignal.css";

export default function SecretSignal({ strength, onApproach, onLeave, quiet }) {
  const revealed = strength >= 1;
  const actionRef = useRef();
  const headingRef = useRef();
  const hold = useRef(null);
  const suppressClick = useRef(false);
  const approach = useRef(onApproach);
  approach.current = onApproach;
  const stopHold = () => {
    clearInterval(hold.current);
    hold.current = null;
  };
  const startHold = () => {
    if (revealed || hold.current !== null) return;
    suppressClick.current = true;
    approach.current(0.022);
    hold.current = setInterval(() => approach.current(0.022), 100);
  };
  useEffect(() => {
    if (revealed || quiet) stopHold();
  }, [revealed, quiet]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stopHold();
    };
    window.addEventListener("blur", stopHold);
    document.addEventListener("visibilitychange", hide);
    return () => {
      stopHold();
      window.removeEventListener("blur", stopHold);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    // Keyboard/tap activation gets a useful next focus target. Scrolling never
    // steals focus or opens a modal over the universe.
    if (revealed && document.activeElement === actionRef.current)
      headingRef.current?.focus({ preventScroll: true });
  }, [revealed]);

  return (
    <section
      className={`secret-signal ${revealed ? "is-revealed" : ""} ${quiet ? "is-quiet" : ""}`}
      aria-labelledby="secret-signal-title"
      data-flight-control={revealed ? "" : undefined}
      style={{ "--signal-strength": strength }}
    >
      <div className="secret-signal-top">
        <span className="eyebrow">
          {revealed ? "A SIGNAL FROM HOME" : "UNIDENTIFIED SIGNAL"}
        </span>
        <span className="secret-signal-id">
          {revealed ? "SECRET 001 / FOUND" : "FREQUENCY 001"}
        </span>
      </div>
      <div className="secret-signal-emblem" aria-hidden="true">
        <span />
        <span />
        <Icon name="star" size={25} />
      </div>
      <h2 id="secret-signal-title" ref={headingRef} tabIndex={-1}>
        {revealed ? "여기까지 와 주셨네요." : "아직, 끝이 아닌 것 같아요."}
      </h2>
      <p className="secret-signal-message">
        {revealed ? (
          <>
            수많은 별을 지나 도착한 곳은,
            <br />
            결국 저의 작은 작업실이에요.
          </>
        ) : (
          <>
            가까워질수록, 신호가 밀어내요.
            <br />
            {quiet
              ? "천천히, 꾸준히 밀어 보세요."
              : "멈추면 조금씩 멀어집니다. 계속 밀어 볼까요?"}
          </>
        )}
      </p>
      {revealed ? (
        <div className="secret-destinations">
          <a href="https://github.com/uiwwsw" target="_blank" rel="noreferrer">
            <Icon name="github" size={22} />
            <span>
              <small>CODE · 코드를 만드는 곳</small>
              <strong>github.com/uiwwsw</strong>
            </span>
            <Icon name="external" size={17} />
          </a>
          <a
            href="https://velog.io/@uiwwsw/posts"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="list" size={22} />
            <span>
              <small>WORDS · 생각을 남기는 곳</small>
              <strong>velog.io/@uiwwsw</strong>
            </span>
            <Icon name="external" size={17} />
          </a>
        </div>
      ) : (
        <div
          className="secret-reception"
          role="meter"
          aria-label="숨겨진 신호 수신율"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(strength * 100)}
        >
          <span aria-hidden="true">
            <i />
          </span>
          <small aria-hidden="true">
            SIGNAL {String(Math.round(strength * 100)).padStart(2, "0")}%
          </small>
        </div>
      )}
      <button
        ref={actionRef}
        className="secret-signal-action"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if (revealed) {
            suppressClick.current = false;
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          startHold();
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onLostPointerCapture={stopHold}
        onBlur={stopHold}
        onKeyDown={(event) => {
          if (revealed) {
            suppressClick.current = false;
            return;
          }
          if (!revealed && [" ", "Enter"].includes(event.key)) {
            event.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(event) => {
          if (revealed) return;
          if ([" ", "Enter"].includes(event.key)) {
            event.preventDefault();
            stopHold();
          }
        }}
        onClick={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            suppressClick.current = false;
            return;
          }
          if (revealed) onLeave();
          else onApproach(0.06);
        }}
      >
        {revealed ? "다시 별들 사이로" : "길게 눌러 신호 밀기"}
        <Icon name="arrow" size={16} />
      </button>
      {!revealed && (
        <p className="secret-signal-hint">
          계속 스크롤 · 위로 쓸어 올리기 · 버튼에서 Space 길게
        </p>
      )}
    </section>
  );
}
