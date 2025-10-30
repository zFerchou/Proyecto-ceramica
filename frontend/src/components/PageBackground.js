import React from "react";
import fondo from "../images/fondo.png";

export default function PageBackground({ children, opacity = 0.22 }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${fondo})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
