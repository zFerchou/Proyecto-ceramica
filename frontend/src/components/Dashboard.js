import React, { useState } from "react";
import InventoryPage from "../components/InventoryPage";
import SalesPage from "../components/SalesPage";

// Datos del cliente
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

// Datos de productos
const productos = [
  {
    id: 1,
    nombre: "Maceta Artesanal",
    precio: 350,
    descripcion: "Maceta hecha a mano, perfecta para plantas pequeñas.",
    imagen: "https://via.placeholder.com/150"
  },
  {
    id: 2,
    nombre: "Vaso Cerámico",
    precio: 120,
    descripcion: "Vaso para café o té, diseño único.",
    imagen: "https://via.placeholder.com/150"
  },
  {
    id: 3,
    nombre: "Plato Decorativo",
    precio: 250,
    descripcion: "Plato de cerámica pintado a mano.",
    imagen: "https://via.placeholder.com/150"
  }
];

// Componente Home
const Home = () => (
  <div>
    <h1 className="client-name">{cliente.nombre}</h1>
    <p className="followers">{cliente.seguidores} seguidores • {cliente.opiniones} opiniones</p>
    <p className="description">{cliente.descripcion}</p>
    <p><strong>Categoría:</strong> {cliente.categoria}</p>
    <p><strong>Ubicación:</strong> {cliente.ubicacion}</p>
    <p><strong>Teléfono:</strong> {cliente.telefono}</p>
    <p><strong>Correo electrónico:</strong> {cliente.correo}</p>
    <p><strong>Estado:</strong> {cliente.estado}</p>
    <p className="promo">{cliente.mensajePromocional}</p>

    {/* Sección de productos */}
    <h2 className="products-title">Nuestros Productos</h2>
    <div className="products-grid">
      {productos.map(producto => (
        <div key={producto.id} className="product-card">
          <img src={producto.imagen} alt={producto.nombre} className="product-image" />
          <h3 className="product-name">{producto.nombre}</h3>
          <p className="product-desc">{producto.descripcion}</p>
          <p className="product-price">${producto.precio}</p>
        </div>
      ))}
    </div>
  </div>
);

// Componente principal Dashboard
export default function Dashboard() {
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Navbar superior */}
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

        {/* Menú desplegable */}
        {menuOpen && (
          <nav className="dropdown-menu">
            <ul>
              <li>
                <button onClick={() => { setActivePage("home"); setMenuOpen(false); }}>
                  Inicio
                </button>
              </li>
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
            </ul>
          </nav>
        )}
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {activePage === "home" && <Home />}
        {activePage === "inventory" && <InventoryPage onClose={() => setActivePage("home")} />}
        {activePage === "sales" && <SalesPage />}
      </main>

      {/* Estilos */}
      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: Arial, sans-serif;
          background: #ecf0f1;
        }

        /* NAVBAR */
        .navbar {
          background: #2c3e50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          position: relative;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        .navbar-left { display: flex; align-items: center; }
        .navbar-title { font-size: 1.4rem; margin-left: 10px; }
        .menu-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: color 0.3s; }
        .menu-btn:hover { color: #1abc9c; }

        /* MENÚ DESPLEGABLE */
        .dropdown-menu { position: absolute; top: 60px; left: 20px; background: #34495e; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); padding: 10px 0; z-index: 10; animation: fadeIn 0.3s ease-in-out; }
        .dropdown-menu ul { list-style: none; margin: 0; padding: 0; }
        .dropdown-menu button {
          width: 160px;
          padding: 10px;
          margin: 5px 10px;
          border: none;
          background: #2c3e50;
          color: white;
          border-radius: 5px;
          text-align: left;
          transition: background 0.2s;
        }
        .dropdown-menu button:hover { background: #1abc9c; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* CONTENIDO PRINCIPAL */
        .main-content { flex-grow: 1; padding: 30px; overflow-y: auto; }

        /* HOME CLIENTE */
        .client-name { font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; }
        .followers { text-align: center; margin-bottom: 1rem; font-weight: 500; }
        .description { text-align: center; margin-bottom: 1rem; }
        .promo { text-align: center; margin-top: 1rem; font-style: italic; color: #6b4f3b; }

        /* PRODUCTOS */
        .products-title { margin-top: 30px; font-size: 1.5rem; text-align: center; margin-bottom: 20px; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .product-card {
          background: linear-gradient(145deg, #e6d6b8, #d9c49f);
          border-radius: 12px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
        .product-image { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
        .product-name { font-size: 1.2rem; font-weight: bold; margin-bottom: 5px; color: #4b3621; }
        .product-desc { font-size: 0.9rem; margin-bottom: 10px; color: #5c4033; }
        .product-price { font-weight: bold; color: #a0522d; font-size: 1rem; }
      `}</style>
    </div>
  );
}
