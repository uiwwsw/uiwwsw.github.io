import React from 'react';

export function HUD({ mode, onExit }) {
    React.useEffect(() => {
        const handleTelemetry = (e) => {
            const { velocity, progress } = e.detail;
            const velEl = document.getElementById('hud-vel');
            const distEl = document.getElementById('hud-dist');
            const barEl = document.getElementById('hud-bar');

            if (velEl) velEl.innerText = `${velocity} km/s`;
            if (distEl) distEl.innerText = `${progress} LY`;
            if (barEl) barEl.style.width = `${progress}%`;
        };

        window.addEventListener('hud-telemetry', handleTelemetry);
        return () => window.removeEventListener('hud-telemetry', handleTelemetry);
    }, []);

    return (
        <div className="hud-container">
            {/* Top Left: System Status */}
            <div className="hud-panel top-left">
                <div className="hud-row">
                    <span className="hud-label">SYSTEM</span>
                    <span className="hud-value active">ONLINE</span>
                </div>
                <div className="hud-row">
                    <span className="hud-label">LOC</span>
                    <span className="hud-value">UNIVERSE_01</span>
                </div>
            </div>

            {/* Top Right: Navigation */}
            <div className="hud-panel top-right">
                {mode === 'IMMERSION' ? (
                    <button className="hud-btn" onClick={onExit}>ABORT (EXIT)</button>
                ) : (
                    <>
                        <button className="hud-btn">MENU</button>
                        <button className="hud-btn">SCAN</button>
                    </>
                )}
            </div>

            {/* Bottom Left: Telemetry */}
            <div className="hud-panel bottom-left">
                <div className="hud-row">
                    <span className="hud-label">VEL</span>
                    <span className="hud-value" id="hud-vel">0.00 km/s</span>
                </div>
                <div className="hud-row">
                    <span className="hud-label">DIST</span>
                    <span className="hud-value" id="hud-dist">0.00 LY</span>
                </div>
                <div className="hud-bar-container">
                    <div className="hud-bar" id="hud-bar" style={{ width: '0%' }}></div>
                </div>
            </div>

            {/* Bottom Right: Controls */}
            <div className="hud-panel bottom-right">
                <div className="hud-row">
                    <span className="hud-label">AUDIO</span>
                    <span className="hud-value">OFF</span>
                </div>
                <div className="hud-row">
                    <span className="hud-label">VIEW</span>
                    <span className="hud-value">3D</span>
                </div>
            </div>

            {/* Center Reticle */}
            <div className="hud-reticle"></div>
        </div>
    );
}
