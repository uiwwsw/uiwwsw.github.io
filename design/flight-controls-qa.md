# Mobile direction, free look and hidden discovery — 2026-09-09

Historical revision (`88145c2`). Mobile direction/normal-flight tuning remain; forced recoils, hidden-camera behavior and ambient parameters are superseded by [earth-focus-qa.md](./earth-focus-qa.md).

## Input and camera

- Finger **down** approaches Earth; finger up retreats. Desktop wheel down remains forward. This is scene navigation, not a scrolling document; article panels keep their native reading behavior.
- After the existing 8 px tap tolerance, a touch gesture travels only if vertical displacement exceeds horizontal displacement by 1.25×. Horizontal/diagonal gestures pan on **both** viewing axes and never turn into travel mid-gesture. A look gesture can continue straight up/down after beginning sideways/diagonally.
- Mobile look gain is viewport-relative: 72 horizontal and 56 vertical target units per screen. Vertical limits expand from `[-16, 20]` to `[-32, 36]`. Travel has a small bounded pitch (`±5` target units), reset on release/cancel/pinch/centering. Forward strokes cannot accumulate a permanently tilted camera. Motion reduction suppresses flight lean.
- Viewing damping is `1 − exp(-8 × dt)` (about 125 ms time constant), independently of camera-position damping `1 − exp(-4.5 × dt)` (about 222 ms). This replaces the shared 455 ms response.
- Wheel gain remains `0.00018` per pixel; a 100 px notch requests 1.8% of the route. Line units normalize to 18 px; page units use actual viewport height. Extreme per-event deltas remain bounded. Vertical touch gain remains 0.30 per viewport height, now in the requested direction.
- Normal travel is limited to `0.075` route units/second. The pending queue is halved from `0.09` to `0.045`, and its exponential tail is shortened from coefficient 8 to 12. Sustained travel remains gradual while release/reversal feels less slippery. The slider and 42-second automatic cruise are unchanged.
- Taps, pinch zoom, drag suppression over labels, pointer cancellation, controls, keyboard access, panels, reduced motion, hidden-page suspension and non-WebGL fallback remain supported.

## Discovery (maintainer-only implementation details)

- No teaser card, approach message, reception meter, frequency label, hold button or accessible spoiler exists before full discovery. Normal exploration UI remains visible through the field. Only `signal >= 1` mounts the reward; the reward component independently returns `null` below that threshold.
- Ordinary momentum is consumed at Earth. Continued fresh input has a buffer of at most `0.032`, expires after 0.25 seconds, and spends at most `0.16` effort units/second. Resistance is `0.15 / (1 + 5 × strength²)`.
- Three invisible shells (26%, 55%, 80% of hidden distance) recoil outward by 0.022, 0.028 and 0.034 distance units. Recoil is radial translation, not flashing or camera shake. Each shell triggers once per attempt; its displaced distance must be earned again. This keeps discovery difficult but achievable.
- A 0.7-second release grace permits resetting a finger between strokes. After that, incomplete progress recedes at `0.035 + 0.04 × strength` per second. Fully losing progress resets the shells. A completed discovery stays open until backward input, exit, Esc, Home or other explicit navigation.
- Reduced motion replaces involuntary recoil with equivalent extra manual distance to pay at each shell. It disables passive recession and normal coasting; there is still no shortcut or hint. Keyboard input spends the same pressure budget.
- The final pose is genuinely close to Earth: radius + 5.5 world units from its center, always outside the atmosphere. The camera gradually faces Earth and reduces free-look offsets during the hidden approach. Ordinary Moon–Earth poses are unchanged.

## Deterministic checks

All timings below start at the ordinary Earth boundary; they are **model simulations, not measured physical-device interaction times**.

| Input | Discovery time |
| --- | ---: |
| Maximal continuous pressure | 45.75 s |
| 120 px wheel events, 6/second | 56.45 s |
| 120 px wheel events, 10/second | 45.88 s |
| 300 px downward strokes on 844 px height, 0.6 s stroke + 0.4 s reset | 68.22 s |
| Keyboard forward, 10 repeats/second | 45.88 s |
| Casual 100 px wheel event once/second for 120 s | No discovery; returns to boundary |

- Sustained discovery at 30/60/120 Hz differs by under 0.02 seconds in the tested continuous-input case.
- Equivalent 35%-screen swipes at heights 640/844/960 and 1/6/30/120 pointer events request the same distance. Equal pixel delivery across wheel/trackpad streams at 6/30/60/120 events per second yields matching normal travel within 0.001 route units.
- A single oversized push and a decaying trackpad fling cannot reveal the reward. Three rebounds occur before discovery; pausing clears pressure, reverse escapes immediately, and reduced motion has no involuntary backwards frames.
- 85 automated tests pass, including rendering the secret component at multiple incomplete strengths (empty DOM) and the complete reward (two links), SSR hydration invariants, photo-only content, Earth geography, catalog growth and SEO.
- Production build and SEO checks pass: 62 indexable HTML pages, all 58 articles and 17 photos. No runtime dependency, texture, GPU draw call or deployment/Velog workflow was added or changed.

## Live verification limitation

The computer-use tool reported the Mac was locked. The owner was asked to unlock it; live mouse/trackpad, mobile dragging, camera response and short-screen reward scrolling have not been verified during this revision. Automated simulations must not be described as a physical-device usability test.
