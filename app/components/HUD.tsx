"use client";

interface HUDProps {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  wave: number;
  enemiesLeft: number;
  screenShake: boolean;
  damageFlash: boolean;
}

export function HUD({ 
  health, maxHealth, shield, maxShield, ammo, maxAmmo, 
  score, wave, enemiesLeft, screenShake, damageFlash 
}: HUDProps) {
  const healthPercent = (health / maxHealth) * 100;
  const shieldPercent = (shield / maxShield) * 100;

  return (
    <>
      {/* Health Bar */}
      <div style={{
        position: "absolute",
        bottom: 30,
        left: 30,
        width: 200,
        height: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        border: "2px solid #333",
        zIndex: 10,
      }}>
        <div style={{
          width: `${healthPercent}%`,
          height: "100%",
          backgroundColor: health > 30 ? "#00ff00" : "#ff0000",
          transition: "width 0.3s ease"
        }} />
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "12px",
          fontWeight: "bold"
        }}>
          HEALTH: {health}/{maxHealth}
        </div>
      </div>

      {/* Shield Bar */}
      <div style={{
        position: "absolute",
        bottom: 60,
        left: 30,
        width: 200,
        height: 15,
        backgroundColor: "rgba(0,0,0,0.7)",
        border: "2px solid #333",
        zIndex: 10,
      }}>
        <div style={{
          width: `${shieldPercent}%`,
          height: "100%",
          backgroundColor: "#00ffff",
          transition: "width 0.3s ease"
        }} />
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "10px",
          fontWeight: "bold"
        }}>
          SHIELD: {shield}/{maxShield}
        </div>
      </div>

      {/* Game Stats */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        color: "white",
        fontFamily: "monospace",
        fontSize: "16px",
        fontWeight: "bold",
        zIndex: 5,
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
        transform: screenShake ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)` : "none",
      }}>
        <div style={{ color: "#ffff00" }}>WAVE: {wave}</div>
        <div style={{ color: "#ff6600" }}>ENEMIES: {enemiesLeft}</div>
        <div style={{ color: "#00ff00" }}>SCORE: {score}</div>
        <div style={{ color: ammo > 5 ? "#ffffff" : "#ff0000" }}>AMMO: {ammo}/{maxAmmo}</div>
        {ammo === 0 && <div style={{ color: "#ff0000", animation: "blink 0.5s infinite" }}>RELOADING...</div>}
      </div>

      {/* Crosshair */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "4px",
        height: "4px",
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: "50%",
        zIndex: 10,
        boxShadow: "0 0 10px rgba(255,255,255,0.5)",
      }} />

      {/* Damage Flash */}
      {damageFlash && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, rgba(255,0,0,0.4) 0%, rgba(255,0,0,0.1) 100%)",
          zIndex: 10,
          animation: "pulse 0.2s ease-out",
        }} />
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}