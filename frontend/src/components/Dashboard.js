import React, { useEffect, useState } from "react";
import InventoryPage from "../components/InventoryPage";
import SalesPage from "../components/SalesPage";
import ProductosView from "../components/ProductosView";
import Login from "../components/Login";
import authService from "../services/authService";
import { getProductosResumenDashboard, API_BASE } from "../api/api";

const cliente = {
  nombre: "Santo Barro Cerámica",
  seguidores: 119,
  opiniones: 0,
  descripcion: "Somos fabricantes de cerámica, hacemos macetas, vasos, platos, bowls, etc. Estamos en Dolores Hidalgo",
  categoria: "Tienda de artículos de temporada",
  ubicacion: "Dolores Hidalgo, Mexico, 37800",
  telefono: "418 124 0354",
  correo: "nayar_garci.com@hotmail.com",
  estado: "Abierto ahora",
  mensajePromocional: "Hecho a mano, con pasión y dedicación. Decora tu mesa con la autenticidad de la cerámica"
};

// Componente Carrusel
const Carousel = ({ productos, titulo, subtitulo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === productos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? productos.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="carousel-card">
      <div className="card-header">
        <h3>{titulo}</h3>
        {subtitulo && <p className="subtitle">{subtitulo}</p>}
      </div>
      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={prevSlide}>❮</button>
        <div className="carousel-content">
          <div className="product-carousel-card">
            <img
              src={productos[currentIndex].imagen_url ? `${API_BASE}${productos[currentIndex].imagen_url}` : "https://via.placeholder.com/150"}
              alt={productos[currentIndex].nombre}
              className="carousel-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://via.placeholder.com/150";
              }}
            />
            <h4 className="carousel-product-name">{productos[currentIndex].nombre}</h4>
            <p className="carousel-product-desc">{productos[currentIndex].descripcion}</p>
            <p className="carousel-product-price">${productos[currentIndex].precio}</p>
            {productos[currentIndex].categoria === 'agotando' && (
              <span className="almost-sold-out">¡Casi Agotado!</span>
            )}
            {productos[currentIndex].categoria === 'top' && (
              <span className="best-seller">★ Más Vendido</span>
            )}
            {typeof productos[currentIndex].stock === 'number' && (
              <p className="stock-info">Stock: {productos[currentIndex].stock}</p>
            )}
          </div>
        </div>
        <button className="carousel-btn next" onClick={nextSlide}>❯</button>
      </div>
      <div className="carousel-dots">
        {productos.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          ></button>
        ))}
      </div>
    </div>
  );
};

// Componente Home
const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProductos, setTopProductos] = useState([]);
  const [recentProductos, setRecentProductos] = useState([]);
  const [agotandoProductos, setAgotandoProductos] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await getProductosResumenDashboard();
      if (!isMounted) return;
      if (data && data.error) {
        setError(data.error);
      } else {
        const top = (data.top || []).map(p => ({ ...p, categoria: 'top' }));
        const rec = (data.recientes || []).map(p => ({ ...p, categoria: 'reciente' }));
        const ago = (data.agotando || []).map(p => ({ ...p, categoria: 'agotando' }));
        setTopProductos(top);
        setRecentProductos(rec);
        setAgotandoProductos(ago);
      }
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="home-container">
      <header className="hero-section">
        <h1 className="client-name">{cliente.nombre}</h1>
        <p className="description">{cliente.descripcion}</p>
        <p className="promo">{cliente.mensajePromocional}</p>
      </header>

      <section className="products-section">
        <h2 className="section-title">Nuestros Productos Destacados</h2>
        {loading && <p style={{ textAlign: 'center' }}>Cargando productos...</p>}
        {error && <p style={{ textAlign: 'center', color: '#c0392b' }}>Error: {error}</p>}
        <div className="products-cards-grid">
          {topProductos.length > 0 && (
          <Carousel 
            productos={topProductos}
            titulo="🏆 Más Vendidos" 
            subtitulo="Los favoritos de nuestros clientes"
          />)}
          {recentProductos.length > 0 && (
          <Carousel 
            productos={recentProductos} 
            titulo="🆕 Recién Agregados" 
            subtitulo="Las últimas creaciones"
          />)}
          {agotandoProductos.length > 0 && (
          <Carousel 
            productos={agotandoProductos} 
            titulo="⚡ Últimas Piezas" 
            subtitulo="¡No te quedes sin el tuyo!"
          />)}
        </div>
      </section>

      <section className="contact-section">
        <h2 className="section-title">Información de Contacto</h2>
        <div className="contact-grid">
          <div className="contact-item">
            <h3>📞 Teléfono</h3>
            <p>{cliente.telefono}</p>
          </div>
          <div className="contact-item">
            <h3>✉️ Correo</h3>
            <p>{cliente.correo}</p>
          </div>
          <div className="contact-item">
            <h3>🏢 Categoría</h3>
            <p>{cliente.categoria}</p>
          </div>
          <div className="contact-item">
            <h3>🕒 Estado</h3>
            <p>{cliente.estado}</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Ubicación</h3>
            <p>📍 {cliente.ubicacion}</p>
          </div>
          <div className="footer-section">
            <h3>Síguenos</h3>
            <div className="social-links">
              <a href="#" className="social-link">📘 Facebook</a>
              <a href="#" className="social-link">📷 Instagram</a>
              <a href="#" className="social-link">📱 WhatsApp</a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Estadísticas</h3>
            <p>👥 {cliente.seguidores} seguidores</p>
            <p>⭐ {cliente.opiniones} opiniones</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 {cliente.nombre}. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en {cliente.ubicacion.split(',')[0]}</p>
        </div>
      </footer>
    </div>
  );
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="dashboard-container">
      <header className="navbar">
        <div className="navbar-left">
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <h2 className="navbar-title">Menú</h2>
        </div>

        {menuOpen && (
          <nav className="dropdown-menu">
            <ul>
              <li>
                <button onClick={() => { setActivePage("home"); setMenuOpen(false); }}>
                  Inicio
                </button>
              </li>

              {/* Mostrar todas las opciones siempre */}
              <li>
                <button onClick={() => { setActivePage("inventory"); setMenuOpen(false); }}>
                  Inventario
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage("sales"); setMenuOpen(false); }}>
                  Ventas
                </button>
              </li>

              <li>
                <button onClick={() => { setActivePage("productos"); setMenuOpen(false); }}>
                  Productos
                </button>
              </li>

              {user ? (
                <li>
                  <button
                    onClick={() => {
                      authService.logout();
                      setUser(null);
                      setActivePage("home");
                      setMenuOpen(false);
                    }}
                    style={{ backgroundColor: "#c0392b", color: "white", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setMenuOpen(false);
                    }}
                  >
                    Iniciar Sesión
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      <main className="main-content">
        {activePage === "home" && <Home />}
        {activePage === "inventory" && <InventoryPage onClose={() => setActivePage("home")} />}
        {activePage === "sales" && <SalesPage />}
        {activePage === "productos" && <ProductosView />}

        {showLogin && !user && (
          <div className="login-modal">
            <div className="modal-overlay" onClick={() => setShowLogin(false)}></div>
            <div className="modal-content">
              <Login
                onLoginSuccess={(loggedUser) => {
                  setUser(loggedUser);
                  setShowLogin(false);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Estilos */}
      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #F5F5DC;
        }

        /* NAVBAR */
        .navbar {
          background: linear-gradient(135deg, #B0836A 0%, #735f53 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .navbar-left { display: flex; align-items: center; }
        .navbar-title { font-size: 1.5rem; margin-left: 15px; font-weight: 600; }
        .menu-btn { 
          background: none; 
          border: none; 
          color: white; 
          font-size: 1.6rem; 
          cursor: pointer; 
          transition: all 0.3s; 
          padding: 8px;
          border-radius: 5px;
        }
        .menu-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }

        /* MENÚ DESPLEGABLE */
        .dropdown-menu { 
          position: absolute; 
          top: 70px; 
          left: 25px; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
          padding: 15px 0; 
          z-index: 10; 
          animation: slideIn 0.3s ease-out; 
          min-width: 180px;
        }
        .dropdown-menu ul { list-style: none; margin: 0; padding: 0; }
        .dropdown-menu button {
          width: 100%;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #333;
          text-align: left;
          transition: all 0.2s;
          font-size: 1rem;
          font-weight: 500;
        }
        .dropdown-menu button:hover { background: #f8f9fa; color: #B0836A; }
        @keyframes slideIn { 
          from { opacity: 0; transform: translateY(-15px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        /* CONTENIDO PRINCIPAL */
        .main-content { 
          flex-grow: 1; 
          padding: 0; 
          overflow-y: auto; 
        }

        /* HOME CONTAINER */
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* HERO SECTION */
        .hero-section {
          background: linear-gradient(135deg, #B0836A 0%, #735f53 100%);
          color: white;
          text-align: center;
          padding: 60px 30px;
          margin: 0 -20px 40px -20px;
          border-radius: 0 0 30px 30px;
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="rgba(255,255,255,0.1)"><polygon points="1000,100 1000,0 0,100"/></svg>');
          background-size: 100% 100%;
        }
        .client-name { 
          font-size: 3rem; 
          font-weight: 700; 
          margin-bottom: 15px; 
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .description { 
          font-size: 1.2rem; 
          margin-bottom: 20px; 
          opacity: 0.9;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 1;
        }
        .promo { 
          font-size: 1.1rem; 
          font-style: italic; 
          background: rgba(255,255,255,0.1);
          padding: 15px 25px;
          border-radius: 25px;
          display: inline-block;
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }

        /* SECCIONES */
        .section-title {
          font-size: 2.2rem;
          font-weight: 600;
          text-align: center;
          margin: 50px 0 30px 0;
          color: #31241F;
          position: relative;
        }
        .section-title::after {
          content: '';
          display: block;
          width: 80px;
          height: 4px;
          background: linear-gradient(135deg, #B0836A 0%, #735f53 100%);
          margin: 15px auto;
          border-radius: 2px;
        }

        /* PRODUCTOS SECTION */
        .products-section {
          margin-bottom: 60px;
        }
        .products-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        /* CAROUSEL CARD */
        .carousel-card {
          background: #D8D8D5;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(49, 36, 31, 0.1);
        }
        .carousel-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(176, 131, 106, 0.25);
          background: #E2CFC3;
        }
        .card-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .card-header h3 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #31241F;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #735f53;
          font-size: 0.9rem;
          margin: 0;
        }

        /* CAROUSEL */
        .carousel-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .carousel-content {
          flex: 1;
          max-width: 280px;
          margin: 0 15px;
        }
        .product-carousel-card {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .carousel-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 15px;
        }
        .carousel-product-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #31241F;
          margin-bottom: 8px;
        }
        .carousel-product-desc {
          font-size: 0.9rem;
          color: #735f53;
          margin-bottom: 15px;
          line-height: 1.4;
        }
        .carousel-product-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: #B0836A;
          margin-bottom: 10px;
        }
        .carousel-btn {
          background: linear-gradient(135deg, #B0836A 0%, #735f53 100%);
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(176, 131, 106, 0.3);
        }
        .carousel-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(176, 131, 106, 0.4);
        }
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 15px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background: #bdc3c7;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .dot.active, .dot:hover {
          background: #B0836A;
          transform: scale(1.2);
        }

        /* BADGES */
        .almost-sold-out {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          margin-top: 5px;
          animation: pulse 2s infinite;
        }
        .best-seller {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          margin-top: 5px;
        }
        .stock-info {
          font-size: 0.8rem;
          color: #735f53;
          margin-top: 5px;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* CONTACT SECTION */
        .contact-section {
          margin-bottom: 60px;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
        }
        .contact-item {
          background: white;
          padding: 25px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }
        .contact-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .contact-item h3 {
          font-size: 1.1rem;
          color: #31241F;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .contact-item p {
          color: #735f53;
          margin: 0;
          font-weight: 500;
        }

        /* FOOTER */
        .footer {
          background: #31241F;
          color: white;
          margin: 0 -20px;
          padding: 40px 20px 20px 20px;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }
        .footer-section h3 {
          font-size: 1.2rem;
          margin-bottom: 15px;
          color: #ecf0f1;
          font-weight: 600;
        }
        .footer-section p {
          margin: 8px 0;
          color: #bdc3c7;
        }
        .social-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .social-link {
          color: #bdc3c7;
          text-decoration: none;
          transition: color 0.3s ease;
          font-weight: 500;
        }
        .social-link:hover {
          color: #3498db;
        }
        .footer-bottom {
          border-top: 1px solid #34495e;
          padding-top: 20px;
          text-align: center;
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-bottom p {
          margin: 5px 0;
          color: #95a5a6;
          font-size: 0.9rem;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .client-name { font-size: 2.2rem; }
          .products-cards-grid { grid-template-columns: 1fr; }
          .carousel-content { margin: 0 10px; }
          .carousel-btn { width: 35px; height: 35px; font-size: 1rem; }
          .hero-section { padding: 40px 20px; }
          .section-title { font-size: 1.8rem; }
      `}</style>
    </div>
  );
}
