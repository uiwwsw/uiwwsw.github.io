import React from "react";
import { Icon } from "./Interface";
import "./SecretSignal.css";

// No teaser, meter, button or accessible spoiler exists before discovery.
export default function SecretSignal({ strength, onLeave, quiet }) {
  if (strength < 1) return null;
  return (
    <section
      className={`secret-signal ${quiet ? "is-quiet" : ""}`}
      aria-labelledby="secret-signal-title"
      data-flight-control=""
    >
      <div className="secret-signal-top">
        <span className="eyebrow">A SIGNAL FROM HOME</span>
        <span className="secret-signal-id">SECRET 001 / FOUND</span>
      </div>
      <h2 id="secret-signal-title">여기까지 와 주셨네요.</h2>
      <p className="secret-signal-message">
        수많은 별을 지나 도착한 곳은,
        <br />
        결국 저의 작은 작업실이에요.
      </p>
      <div className="secret-destinations">
        <a href="https://github.com/uiwwsw" target="_blank" rel="noreferrer">
          <Icon name="github" size={22} />
          <span>
            <small>CODE · 코드를 만드는 곳</small>
            <strong>github.com/uiwwsw</strong>
          </span>
          <Icon name="external" size={17} />
        </a>
        <a href="https://velog.io/@uiwwsw/posts" target="_blank" rel="noreferrer">
          <Icon name="list" size={22} />
          <span>
            <small>WORDS · 생각을 남기는 곳</small>
            <strong>velog.io/@uiwwsw</strong>
          </span>
          <Icon name="external" size={17} />
        </a>
      </div>
      <button className="secret-signal-action" onClick={onLeave}>
        다시 별들 사이로
        <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}
