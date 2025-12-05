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
      fontFamily: "monospace",
      textAlign: "center"
    }}>
      <h1 style={{ color: "#ff0040", fontSize: "3rem", marginBottom: "2rem" }}>OPERATION SINGULARITY</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>Fast-Paced Gory FPS</p>
      <a 
        href="/fps" 
        style={{
          padding: "1rem 2rem",
          fontSize: "1.5rem",
          backgroundColor: "#ff0040",
          color: "white",
          textDecoration: "none",
          fontFamily: "monospace",
          fontWeight: "bold",
          border: "2px solid #ff0040"
        }}
      >
        PLAY GAME
      </a>
    </div>
  );
}