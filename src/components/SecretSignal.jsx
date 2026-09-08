import React, { useEffect, useRef } from "react";
import { Icon } from "./Interface";
import "./SecretSignal.css";

export default function SecretSignal({ strength, onApproach, onLeave, quiet }) {
  const revealed = strength >= 1;
  const actionRef = useRef();
  const headingRef = useRef();
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
            지구 너머에서 희미한 신호가 들려요.
            <br />
            조금만 더 가까이 와 볼래요?
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
        onClick={revealed ? onLeave : onApproach}
      >
        {revealed ? "다시 별들 사이로" : "신호에 다가가기"}
        <Icon name="arrow" size={16} />
      </button>
      {!revealed && (
        <p className="secret-signal-hint">
          계속 스크롤 · 위로 쓸어 올리기 · ↑ 키
        </p>
      )}
    </section>
  );
}
