export const metadata = {
  title: "AI Rebellion FPS",
  description: "Fast-paced browser FPS built with React + Three.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>{children}</body>
    </html>
  );
}
