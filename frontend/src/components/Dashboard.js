import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import PageBackground from "./PageBackground";
import InventoryPage from "../components/InventoryPage";
import SalesPage from "../components/SalesPage";
import ProductosView from "../components/ProductosView";
import Login from "../components/Login";
import authService from "../services/authService";
import { getProductosResumenDashboard, API_BASE, getProductos } from "../api/api";
import logo from "../images/logo.png";

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

// Componente Categorías (reemplaza al Carousel)
const CategoriasGrid = ({ categorias }) => {
  return (
    <div className="categorias-grid">
      {categorias.map((categoria, index) => (
        <div 
          key={index}
          className="categoria-card"
          onClick={() => {
            // Navegar a productos con filtro aplicado
            window.dispatchEvent(new CustomEvent('navigateToProductos', { 
              detail: { categoria: categoria.id } 
            }));
          }}
        >
          <div className="categoria-icon">{categoria.icono}</div>
          <h3 className="categoria-title">{categoria.titulo}</h3>
          <p className="categoria-subtitle">{categoria.subtitulo}</p>
          <div className="categoria-count">{categoria.cantidad} productos</div>
        </div>
      ))}
    </div>
  );
};

// Componente Home
const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productos, setProductos] = useState([]);

  // Definir las categorías para el grid
  const categorias = [
    {
      id: 1,
      icono: "💎",
      titulo: "Joyería",
      subtitulo: "Accesorios únicos en cerámica",
      cantidad: productos.filter(p => p.id_categoria === 1).length
    },
    {
      id: 2,
      icono: "🏺",
      titulo: "Macetas",
      subtitulo: "Para tus plantas favoritas",
      cantidad: productos.filter(p => p.id_categoria === 2).length
    },
    {
      id: 3,
      icono: "🍽️",
      titulo: "Productos de Cocina",
      subtitulo: "Vajillas y utensilios",
      cantidad: productos.filter(p => p.id_categoria === 3).length
    },
    {
      id: 0,
      icono: "🌟",
      titulo: "Todos los Productos",
      subtitulo: "Explora toda nuestra colección",
      cantidad: productos.length
    }
  ];

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getProductos();
        const data = await res.json();
        if (!isMounted) return;
        
        if (res.ok && Array.isArray(data)) {
          setProductos(data);
        } else {
          setError(data?.error || 'Error al cargar productos');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="home-container">
      <header className="hero-section">
        <img src={logo} alt={cliente.nombre} className="client-logo" />
        <h1 className="client-name">{cliente.nombre}</h1>
        <p className="description">{cliente.descripcion}</p>
        <p className="promo">{cliente.mensajePromocional}</p>
      </header>

      <section className="products-section">
        <h2 className="section-title">Nuestras Categorías</h2>
        {loading && <p style={{ textAlign: 'center' }}>Cargando productos...</p>}
        {error && <p style={{ textAlign: 'center', color: '#c0392b' }}>Error: {error}</p>}
        
        <CategoriasGrid categorias={categorias} />
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
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [productosFilter, setProductosFilter] = useState(null);

  // Escuchar el evento de navegación a productos con filtro
  React.useEffect(() => {
    const handleNavigateToProductos = (event) => {
      setProductosFilter(event.detail.categoria);
      setActivePage("productos");
    };

    window.addEventListener('navigateToProductos', handleNavigateToProductos);
    
    return () => {
      window.removeEventListener('navigateToProductos', handleNavigateToProductos);
    };
  }, []);

  return (
    <PageBackground>
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
                <button type="button" onClick={() => { setActivePage("home"); setMenuOpen(false); }}>
                  Inicio
                </button>
              </li>

              <li>
                <button type="button" onClick={() => { setActivePage("inventory"); setMenuOpen(false); }}>
                  Inventario
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { setActivePage("sales"); setMenuOpen(false); }}>
                  Ventas
                </button>
              </li>

              <li>
                <button type="button" onClick={() => { 
                  setProductosFilter(null);
                  setActivePage("productos"); 
                  setMenuOpen(false); 
                }}>
                  Productos
                </button>
              </li>

              {authService.isAuthenticated() ? (
                <li>
                  <button type="button"
                    onClick={() => {
                      authService.logout();
                      setUser(null);
                      setActivePage("home");
                      setMenuOpen(false);
                      navigate('/login');
                    }}
                    style={{ backgroundColor: "#c0392b", color: "white", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              ) : (
                <li>
                  <button type="button" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
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
        {activePage === "productos" && <ProductosView filter={productosFilter} />}

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

      {/* Estilos completos */}
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: transparent; /* Dejar ver el fondo de PageBackground */
        }

        /* NAVBAR */
        .navbar {
          background: linear-gradient(135deg, rgba(176,131,106,0.90) 0%, rgba(115,95,83,0.90) 100%);
          /* Opcional: efecto cristalino sutil sobre el fondo */
          backdrop-filter: saturate(1.1) blur(2px);
          -webkit-backdrop-filter: saturate(1.1) blur(2px);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          position: fixed; /* mantener navbar visible al hacer scroll */
          top: 0; left: 0; right: 0;
          z-index: 3000; /* por encima del contenido y overlays regulares */
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
          z-index: 2000; /* por encima de overlays/modales */ 
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
          padding-top: 90px; /* compensar altura del navbar fijo */
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
        .client-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
          display: block;
          margin: 0 auto 10px auto;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
          background: rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 8px;
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

        /* CATEGORIAS GRID */
        .categorias-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .categoria-card {
          background: #D8D8D5;
          border-radius: 20px;
          padding: 30px 25px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .categoria-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(176, 131, 106, 0.25);
          background: #E2CFC3;
          border-color: #B0836A;
        }

        .categoria-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #B0836A 0%, #735f53 100%);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .categoria-card:hover::before {
          transform: scaleX(1);
        }

        .categoria-icon {
          font-size: 3rem;
          margin-bottom: 15px;
          display: block;
        }

        .categoria-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: #31241F;
          margin-bottom: 8px;
        }

        .categoria-subtitle {
          color: #735f53;
          font-size: 0.95rem;
          margin-bottom: 15px;
          line-height: 1.4;
        }

        .categoria-count {
          background: rgba(176, 131, 106, 0.15);
          color: #B0836A;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
        }

        /* PRODUCTOS SECTION */
        .products-section {
          margin-bottom: 60px;
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

        /* LOGIN MODAL */
        .login-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .client-name { font-size: 2.2rem; }
          .categorias-grid { grid-template-columns: 1fr; }
          .hero-section { padding: 40px 20px; }
          .section-title { font-size: 1.8rem; }
          .categoria-card { padding: 25px 20px; }
          .navbar { padding: 12px 20px; }
          .navbar-title { font-size: 1.3rem; }
        }

        @media (max-width: 480px) {
          .client-name { font-size: 1.8rem; }
          .description { font-size: 1rem; }
          .promo { font-size: 0.9rem; padding: 12px 20px; }
          .section-title { font-size: 1.5rem; }
          .contact-grid { grid-template-columns: 1fr; }
          .footer-content { grid-template-columns: 1fr; }
        }
      `}</style>
      </div>
    </PageBackground>
  );
}