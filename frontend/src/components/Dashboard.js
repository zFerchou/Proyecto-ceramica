import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import PageBackground from "./PageBackground";
import InventoryPage from "../components/InventoryPage";
import SalesPage from "../components/SalesPage";
import ProductosView from "../components/ProductosView";
import Login from "../components/Login";
import authService from "../services/authService";
import api from "../api/api";
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

// Componente Categorías
const CategoriasGrid = ({ categorias }) => {
  return (
    <div className="categorias-grid">
      {categorias.map((categoria, index) => (
        <div 
          key={index}
          className="categoria-card"
          onClick={() => {
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
        const data = await api.getProductos();
        
        if (!isMounted) return;
        
        if (Array.isArray(data)) {
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
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del usuario y estadísticas - CORREGIDO
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      const currentUser = authService.getUser();
      setUser(currentUser);
      
      // Verificar si el usuario existe y no es admin
      if (currentUser && currentUser.rol && currentUser.rol.toLowerCase() !== 'admin') {
        try {
          console.log('Cargando estadísticas para empleado:', currentUser);
          const stats = await api.getMisEstadisticas();
          console.log('Estadísticas recibidas:', stats);
          
          if (stats && !stats.error) {
            setUserStats(stats);
          } else {
            console.warn('Error en estadísticas:', stats?.error);
          }
        } catch (error) {
          console.error('Error cargando estadísticas:', error);
        }
      }
      setLoading(false);
    };

    loadUserData();
    
    const checkAuth = () => {
      const currentUser = authService.getUser();
      if (!currentUser && authService.isAuthenticated()) {
        loadUserData();
      }
      setUser(currentUser);
    };
    
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNavigateToProductos = (event) => {
      setProductosFilter(event.detail.categoria);
      setActivePage("productos");
    };

    window.addEventListener('navigateToProductos', handleNavigateToProductos);
    
    return () => {
      window.removeEventListener('navigateToProductos', handleNavigateToProductos);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setUserStats(null);
    setActivePage("home");
    setMenuOpen(false);
    navigate('/login');
  };

  const renderUserInfo = () => {
    if (!user) return null;
    
    return (
      <div className="user-info-navbar">
        <span className="user-name">{user.nombre || user.email}</span>
        <span className={`user-role ${user.rol === 'admin' ? 'admin-role' : 'employee-role'}`}>
          {user.rol === 'admin' ? 'Administrador' : 'Empleado'}
        </span>
      </div>
    );
  };

  const renderEmployeeStats = () => {
    if (!user || user.rol === 'admin' || !userStats) return null;
    
    // Asegurarnos de que los valores sean números válidos
    const ventasHoy = parseInt(userStats.hoy?.ventas) || 0;
    const totalGeneral = parseFloat(userStats.general?.total) || 0;
    
    return (
      <li className="stats-menu-item">
        <div className="menu-stats">
          <h4>Mis Estadísticas</h4>
          <div className="stat-item">
            <span>Hoy:</span>
            <span>{ventasHoy} ventas</span>
          </div>
          <div className="stat-item">
            <span>Total:</span>
            <span>${totalGeneral.toFixed(2)}</span>
          </div>
        </div>
      </li>
    );
  };

  return (
    <PageBackground>
      <div className="dashboard-container">
      <header className="navbar">
        <div className="navbar-left">
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            disabled={loading}
          >
            {loading ? '...' : '☰'}
          </button>
          <h2 className="navbar-title">
            {user ? (user.rol === 'admin' ? 'Admin' : 'Ventas') : 'Menú'}
          </h2>
        </div>

        <div className="navbar-center">
          {user ? (
            renderUserInfo()
          ) : (
            <span className="navbar-welcome">Bienvenido</span>
          )}
        </div>

        <div className="navbar-right">
          <button
            className="home-btn"
            onClick={() => setActivePage("home")}
            aria-label="Ir al inicio"
            disabled={loading}
          >
             Inicio
          </button>
        </div>

        {menuOpen && (
          <nav className="dropdown-menu">
            <ul>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActivePage("home"); setMenuOpen(false); }}
                  disabled={loading}
                >
                  Inicio
                </button>
              </li>

              {user && user.rol === 'admin' && (
                <li>
                  <button 
                    type="button" 
                    onClick={() => { setActivePage("inventory"); setMenuOpen(false); }}
                    disabled={loading}
                  >
                    Inventario
                  </button>
                </li>
              )}
              
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActivePage("sales"); setMenuOpen(false); }}
                  disabled={loading}
                >
                  Ventas
                </button>
              </li>

              <li>
                <button 
                  type="button" 
                  onClick={() => { 
                    setProductosFilter(null);
                    setActivePage("productos"); 
                    setMenuOpen(false); 
                  }}
                  disabled={loading}
                >
                  Productos
                </button>
              </li>

              {renderEmployeeStats()}

              {user ? (
                <li>
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="logout-btn"
                    disabled={loading}
                  >
                    Cerrar sesión
                  </button>
                </li>
              ) : (
                <li>
                  <button 
                    type="button" 
                    onClick={() => { setMenuOpen(false); setShowLogin(true); }}
                    disabled={loading}
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
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : (
          <>
            {activePage === "home" && <Home />}
            {activePage === "inventory" && user && user.rol === 'admin' && <InventoryPage onClose={() => setActivePage("home")} />}
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
                      if (loggedUser.rol === 'admin') {
                        navigate('/');
                      } else {
                        navigate('/ventas');
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: transparent;
        }

        .navbar {
          background: linear-gradient(135deg, rgba(176,131,106,0.90) 0%, rgba(115,95,83,0.90) 100%);
          backdrop-filter: saturate(1.1) blur(2px);
          -webkit-backdrop-filter: saturate(1.1) blur(2px);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 3000;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .navbar-left { 
          display: flex; 
          align-items: center; 
          min-width: 120px;
        }
        .navbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          min-width: 0;
          overflow: hidden;
        }
        .navbar-right { 
          display: flex; 
          align-items: center; 
          min-width: 80px;
          justify-content: flex-end;
        }
        .navbar-title { 
          font-size: 1.5rem; 
          margin-left: 15px; 
          font-weight: 600;
          white-space: nowrap;
        }
        
        .menu-btn { 
          background: none; 
          border: none; 
          color: white; 
          font-size: 1.6rem; 
          cursor: pointer; 
          transition: all 0.3s; 
          padding: 8px;
          border-radius: 5px;
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .menu-btn:hover:not(:disabled) { 
          background: rgba(255,255,255,0.1); 
          transform: scale(1.1); 
        }
        .menu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .home-btn {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .home-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .home-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .user-info-navbar {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          padding: 5px 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          min-width: 0;
          max-width: 100%;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        
        .user-role {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 12px;
          margin-top: 3px;
          white-space: nowrap;
        }
        
        .admin-role {
          background-color: #2c3e50;
          color: #ecf0f1;
        }
        
        .employee-role {
          background-color: #27ae60;
          color: white;
        }
        
        .navbar-welcome {
          color: white;
          font-size: 1rem;
          opacity: 0.9;
          padding: 5px 10px;
        }

        .dropdown-menu { 
          position: absolute; 
          top: 70px; 
          left: 25px; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
          padding: 15px 0; 
          z-index: 2000; 
          animation: slideIn 0.3s ease-out; 
          min-width: 200px;
          max-width: 300px;
        }
        .dropdown-menu ul { 
          list-style: none; 
          margin: 0; 
          padding: 0; 
        }
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
          cursor: pointer;
        }
        .dropdown-menu button:hover:not(:disabled) { 
          background: #f8f9fa; 
          color: #B0836A; 
        }
        .dropdown-menu button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @keyframes slideIn { 
          from { opacity: 0; transform: translateY(-15px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .stats-menu-item {
          padding: 10px 20px;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          margin: 5px 0;
        }
        
        .menu-stats {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .menu-stats h4 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #333;
          text-align: center;
          font-weight: 600;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 4px;
          color: #555;
        }
        
        .stat-item span:first-child {
          font-weight: 500;
          color: #333;
        }
        
        .stat-item span:last-child {
          color: #B0836A;
          font-weight: 600;
        }

        .logout-btn {
          background-color: #c0392b;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.3s;
          font-weight: 500;
          margin-top: 5px;
        }
        
        .logout-btn:hover:not(:disabled) {
          background-color: #a93226;
        }
        
        .logout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .main-content { 
          flex-grow: 1; 
          padding: 0; 
          overflow-y: auto; 
          padding-top: 90px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 20px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #B0836A;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

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

        .products-section {
          margin-bottom: 60px;
        }

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

        @media (max-width: 768px) {
          .client-name { font-size: 2.2rem; }
          .categorias-grid { grid-template-columns: 1fr; }
          .hero-section { padding: 40px 20px; }
          .section-title { font-size: 1.8rem; }
          .categoria-card { padding: 25px 20px; }
          .navbar { padding: 12px 15px; }
          .navbar-title { font-size: 1.3rem; margin-left: 10px; }
          .home-btn { 
            padding: 8px 12px; 
            font-size: 0.9rem; 
          }
          .user-name {
            max-width: 150px;
            font-size: 0.8rem;
          }
          .dropdown-menu {
            left: 15px;
            right: 15px;
            max-width: calc(100vw - 30px);
          }
        }

        @media (max-width: 480px) {
          .client-name { font-size: 1.8rem; }
          .section-title { font-size: 1.5rem; }
          .contact-grid { grid-template-columns: 1fr; }
          .footer-content { grid-template-columns: 1fr; }
          .home-btn { 
            padding: 6px 10px; 
            font-size: 0.85rem; 
          }
          .navbar {
            padding: 10px;
          }
          .navbar-title {
            font-size: 1.1rem;
            margin-left: 8px;
          }
          .user-info-navbar {
            padding: 3px 6px;
          }
          .user-name {
            max-width: 120px;
            font-size: 0.75rem;
          }
          .user-role {
            font-size: 0.65rem;
            padding: 1px 6px;
          }
        }
      `}</style>
      </div>
    </PageBackground>
  );
}