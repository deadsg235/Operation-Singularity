export default function HomePage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#000",
      color: "#fff",
      fontFamily: "monospace"
    }}>
      <h1 style={{ color: "#ff0040", fontSize: "2rem" }}>OPERATION SINGULARITY</h1>
      <p>Fast-Paced Gory FPS Game</p>
      <a href="/fps" style={{ color: "#00ff00", fontSize: "1.2rem" }}>▶ PLAY GAME</a>
    </div>
  );
}