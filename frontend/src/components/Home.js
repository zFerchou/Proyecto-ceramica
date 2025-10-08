import React from 'react';

export default function Home() {
  return (
    <div className="home-page">
      <h1>Bienvenido al Dashboard</h1>
      <p>Selecciona una opción en el menú lateral para comenzar.</p>

      <style jsx>{`
        .home-page {
          text-align: center;
          margin-top: 100px;
          font-family: Arial, sans-serif;
        }

        .home-page h1 {
          font-size: 2em;
          color: #2c3e50;
        }

        .home-page p {
          font-size: 1.2em;
          color: #34495e;
        }
      `}</style>
    </div>
  );
}
