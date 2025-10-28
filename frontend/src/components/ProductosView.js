import React, { useEffect, useMemo, useState } from "react";
import { getProductos, API_BASE } from "../api/api";
import fondo from "../images/fondo.png";
import QRImage from "./QRImage";

// Paleta de colores coherente con la estética artesanal
const COLORS = {
  terracota: "#B0836A",
  hueso: "#F5F5DC",
  grisPiedra: "#735f53",
  arena: "#D8D8D5",
  carbon: "#31241F",
  hoverSand: "#E2CFC3",
};

// Mapeo de categorías
const CATEGORIAS = {
  1: { nombre: "Joyería", icon: "💎", color: "#B0836A" },
  2: { nombre: "Macetas", icon: "🏺", color: "#8A9B68" }, 
  3: { nombre: "Productos de cocina", icon: "🍽️", color: "#C44536" }
};

export default function ProductosView({ filter = null }) {
  const [productos, setProductos] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [bgOffset, setBgOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState(filter);

  // Sincronizar el filtro cuando cambia la prop
  useEffect(() => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
    }
  }, [filter]);

  // --- Cargar productos desde la API ---
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getProductos();
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || `Error ${res.status}`);
        } else {
          setProductos(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Modo responsivo ---
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Fondo con efecto parallax ---
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setBgOffset(window.scrollY * 0.25);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Agrupar productos por categoría ---
  const productosPorCategoria = useMemo(() => {
    const categorias = {};
    
    // Inicializar todas las categorías
    Object.keys(CATEGORIAS).forEach(id => {
      categorias[id] = {
        ...CATEGORIAS[id],
        productos: []
      };
    });

    // Agregar productos a sus categorías
    productos.forEach(producto => {
      const categoriaId = producto.id_categoria?.toString();
      if (categoriaId && categorias[categoriaId]) {
        categorias[categoriaId].productos.push(producto);
      } else {
        // Si no tiene categoría o la categoría no existe, poner en "Otros"
        if (!categorias.otros) {
          categorias.otros = {
            nombre: "Otros",
            icon: "📦",
            color: COLORS.grisPiedra,
            productos: []
          };
        }
        categorias.otros.productos.push(producto);
      }
    });

    return categorias;
  }, [productos]);

  // --- Filtrar productos por categoría y búsqueda ---
  const filtered = useMemo(() => {
    let filteredProductos = productos;
    
    // Aplicar filtro de categoría si existe
    if (activeFilter && activeFilter !== 0) {
      filteredProductos = filteredProductos.filter(p => p.id_categoria === activeFilter);
    }

    // Aplicar búsqueda por texto
    const q = query.trim().toLowerCase();
    if (q) {
      filteredProductos = filteredProductos.filter(
        (p) =>
          (p.nombre || "").toLowerCase().includes(q) ||
          (p.descripcion || "").toLowerCase().includes(q)
      );
    }

    return filteredProductos;
  }, [productos, query, activeFilter]);

  // --- Productos filtrados por categoría para búsqueda ---
  const filteredPorCategoria = useMemo(() => {
    if (!query.trim()) return productosPorCategoria;

    const categoriasFiltradas = {};
    Object.keys(productosPorCategoria).forEach(categoriaId => {
      const categoria = productosPorCategoria[categoriaId];
      const productosFiltrados = categoria.productos.filter(p =>
        (p.nombre || "").toLowerCase().includes(query.toLowerCase()) ||
        (p.descripcion || "").toLowerCase().includes(query.toLowerCase())
      );

      if (productosFiltrados.length > 0) {
        categoriasFiltradas[categoriaId] = {
          ...categoria,
          productos: productosFiltrados
        };
      }
    });

    return categoriasFiltradas;
  }, [productosPorCategoria, query]);

  // Obtener el título de la categoría activa
  const getFilterTitle = () => {
    if (!activeFilter || activeFilter === 0) {
      return "🌟 Todos los Productos";
    }
    const categoria = CATEGORIAS[activeFilter];
    return `${categoria.icon} ${categoria.nombre}`;
  };

  // Función para limpiar filtro
  const clearFilter = () => {
    setActiveFilter(null);
  };

  // Renderizar sección de categoría
  const renderCategoriaSection = (categoriaId, categoria) => {
    if (categoria.productos.length === 0) return null;

    return (
      <section key={categoriaId} style={styles.categoriaSection}>
        <div style={styles.categoriaHeader}>
          <div style={{
            ...styles.categoriaIcon,
            backgroundColor: categoria.color
          }}>
            {categoria.icon}
          </div>
          <div>
            <h2 style={styles.categoriaTitle}>{categoria.nombre}</h2>
            <p style={styles.categoriaCount}>
              {categoria.productos.length} producto{categoria.productos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div style={styles.grid}>
          {categoria.productos.map((p, idx) => (
            <article
              key={(p.id_producto ?? idx) + "_" + p.nombre}
              style={{
                ...styles.card,
                ...(hoverIdx === `${categoriaId}-${idx}` ? styles.cardHover : {}),
              }}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelected(p);
              }}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoverIdx(`${categoriaId}-${idx}`)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div style={styles.cardImage}>
                <div style={styles.productImagePlaceholder}>
                  {p.imagen_url ? (
                    <img
                      src={`${API_BASE}${p.imagen_url}`}
                      alt={p.nombre}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Imagen no disponible";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "Imagen"
                  )}
                </div>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{p.nombre}</h3>
                <p style={styles.cardDesc}>
                  {p.descripcion || "Sin descripción"}
                </p>
                <div style={styles.cardPrice}>
                  ${Number(p.precio).toFixed(2)}
                </div>
                <div style={{
                  ...styles.categoriaBadge,
                  backgroundColor: `${categoria.color}20`,
                  color: categoria.color
                }}>
                  {categoria.icon} {categoria.nombre}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.bgImagePlaceholder,
          backgroundImage: `url(${fondo})`,
          transform: `translateY(${-bgOffset}px)`,
        }}
        aria-hidden
      />

      <div style={styles.container}>
        {/* --- Encabezado --- */}
        <header style={styles.header}>
          <h1 style={styles.title}>{getFilterTitle()}</h1>
          <p style={styles.subtitle}>
            {activeFilter && activeFilter !== 0 
              ? `Categoría: ${CATEGORIAS[activeFilter].nombre}` 
              : 'Piezas únicas hechas a mano'
            }
          </p>
          
          {/* Filtros activos - SOLO se muestra cuando hay un filtro activo real */}
          {activeFilter && activeFilter !== 0 && (
            <div style={styles.activeFilter}>
              <span style={styles.filterBadge}>
                {getFilterTitle()}
                <button 
                  onClick={clearFilter}
                  style={styles.clearFilter}
                  aria-label="Quitar filtro"
                >
                  ×
                </button>
              </span>
            </div>
          )}
          
          <div style={styles.searchRow}>
            <input
              aria-label="Buscar productos"
              placeholder="Buscar por nombre o descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
            />
            {/* Botón "Ver Todos" - SOLO se muestra cuando hay filtro activo */}
            {activeFilter && activeFilter !== 0 && (
              <button 
                onClick={clearFilter}
                style={styles.clearFilterBtn}
              >
                Ver Todos
              </button>
            )}
          </div>
        </header>

        {/* --- Mensajes de estado --- */}
        {error && <div style={styles.errorBox}>{String(error)}</div>}
        {loading && <div style={styles.loading}>Cargando productos...</div>}
        
        {/* --- Vista cuando hay búsqueda activa --- */}
        {!loading && query.trim() && (
          <>
            <div style={styles.searchResultsHeader}>
              <h2 style={styles.searchTitle}>
                🔍 Resultados de búsqueda para "{query}"
              </h2>
              <p style={styles.searchSubtitle}>
                {Object.values(filteredPorCategoria).reduce((total, cat) => total + cat.productos.length, 0)} 
                producto(s) encontrado(s)
              </p>
            </div>
            
            {Object.values(filteredPorCategoria).length === 0 ? (
              <div style={styles.empty}>
                No se encontraron productos para "{query}"
                <br />
                <button 
                  onClick={() => setQuery('')}
                  style={styles.resetFiltersBtn}
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              Object.keys(filteredPorCategoria).map(categoriaId =>
                renderCategoriaSection(categoriaId, filteredPorCategoria[categoriaId])
              )
            )}
          </>
        )}

        {/* --- Vista normal por categorías (sin búsqueda) --- */}
        {!loading && !query.trim() && (
          <>
            {activeFilter && activeFilter !== 0 ? (
              // Vista de una sola categoría cuando hay filtro activo
              Object.keys(productosPorCategoria)
                .filter(catId => catId === activeFilter.toString())
                .map(categoriaId => 
                  renderCategoriaSection(categoriaId, productosPorCategoria[categoriaId])
                )
            ) : (
              // Vista de todas las categorías
              Object.keys(productosPorCategoria).map(categoriaId =>
                renderCategoriaSection(categoriaId, productosPorCategoria[categoriaId])
              )
            )}
            
            {/* Mensaje cuando no hay productos */}
            {Object.values(productosPorCategoria).every(cat => cat.productos.length === 0) && (
              <div style={styles.empty}>
                No se encontraron productos.
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Panel de detalle --- */}
      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div
            style={{
              ...styles.detailModal,
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.detailLeft}>
              {selected.imagen_url ? (
                <img
                  src={`${API_BASE}${selected.imagen_url}`}
                  alt={selected.nombre}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "";
                    e.currentTarget.alt = "Imagen no disponible";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              ) : (
                <div style={styles.detailImage}>Imagen grande</div>
              )}
            </div>

            <div style={styles.detailRight}>
              <h2 style={styles.detailTitle}>{selected.nombre}</h2>
              <div style={styles.detailPrice}>
                ${Number(selected.precio).toFixed(2)}
              </div>
              <p style={styles.detailDesc}>
                {selected.descripcion || "Pieza de cerámica artesanal."}
              </p>

              {/* --- Mostrar categoría --- */}
              {selected.id_categoria && (
                <div style={{
                  ...styles.categoriaBadgeLarge,
                  backgroundColor: `${CATEGORIAS[selected.id_categoria]?.color || COLORS.terracota}20`,
                  color: CATEGORIAS[selected.id_categoria]?.color || COLORS.terracota
                }}>
                  {CATEGORIAS[selected.id_categoria]?.icon || '📦'} 
                  {CATEGORIAS[selected.id_categoria]?.nombre || 'Categoría desconocida'}
                </div>
              )}

              {/* --- Mostrar QR dinámico --- */}
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <strong>Código QR:</strong>
                <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "center" }}>
                  <div style={{ background: "#fff", padding: 8, borderRadius: 8 }}>
                    <QRImage value={JSON.stringify({ id_producto: selected.id_producto, nombre: selected.nombre })} size={180} />
                  </div>
                </div>
              </div>

              {/* --- Info extra --- */}
              <div style={styles.detailMeta}>
                <span style={styles.metaItem}>
                  <strong>Disponibles:</strong> {selected.cantidad}
                </span>
              </div>

              {/* --- Acciones --- */}
              <div style={styles.actions}>
                <button
                  style={styles.cta}
                  onClick={() =>
                    window.open(
                      `${
                        process.env.REACT_APP_API_BASE
                      }${selected.qr_image_path?.replace(/^\/public/, "") || ''}`,
                      "_blank"
                    )
                  }
                >
                  Escanear QR
                </button>
                <button
                  style={styles.secondaryBtn}
                  onClick={() => setSelected(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: COLORS.hueso,
    color: COLORS.grisPiedra,
    position: "relative",
  },
  bgImagePlaceholder: {
    position: "absolute",
    inset: 0,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover",
    opacity: 0.22,
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    position: "relative",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "2rem 1rem 3rem",
    zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: "1.5rem" },
  title: { color: COLORS.terracota, fontSize: "2rem", marginBottom: "0.25rem" },
  subtitle: { color: COLORS.carbon, opacity: 0.8 },
  activeFilter: {
    margin: "1rem 0",
    display: "flex",
    justifyContent: "center",
  },
  filterBadge: {
    background: `linear-gradient(135deg, ${COLORS.terracota} 0%, ${COLORS.grisPiedra} 100%)`,
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  clearFilter: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: { 
    marginTop: "1rem", 
    display: "flex", 
    justifyContent: "center",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    width: "100%",
    maxWidth: 400,
    padding: "0.8rem 1rem",
    borderRadius: 12,
    border: `1px solid ${COLORS.arena}`,
    backgroundColor: "#fff",
    outline: "none",
    color: COLORS.carbon,
  },
  clearFilterBtn: {
    background: COLORS.carbon,
    color: "white",
    border: "none",
    padding: "0.8rem 1.2rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  // Secciones de categoría
  categoriaSection: {
    marginBottom: "3rem",
  },
  categoriaHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    paddingBottom: "0.5rem",
    borderBottom: `2px solid ${COLORS.arena}`,
  },
  categoriaIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  categoriaTitle: {
    color: COLORS.carbon,
    fontSize: "1.5rem",
    margin: 0,
  },
  categoriaCount: {
    color: COLORS.grisPiedra,
    margin: 0,
    fontSize: "0.9rem",
  },
  // Resultados de búsqueda
  searchResultsHeader: {
    textAlign: "center",
    marginBottom: "2rem",
    padding: "1rem",
    background: "rgba(176, 131, 106, 0.1)",
    borderRadius: "12px",
  },
  searchTitle: {
    color: COLORS.terracota,
    fontSize: "1.3rem",
    margin: "0 0 0.5rem 0",
  },
  searchSubtitle: {
    color: COLORS.grisPiedra,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: COLORS.arena,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `${COLORS.carbon}20`,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease",
  },
  cardHover: {
    transform: "translateY(-2px)",
    backgroundColor: COLORS.hoverSand,
    boxShadow: "0 10px 24px rgba(176,131,106,0.35), 0 0 0 2px rgba(176,131,106,0.35)",
    borderColor: COLORS.terracota,
  },
  cardImage: { height: 160, backgroundColor: "#fff" },
  productImagePlaceholder: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.carbon,
    opacity: 0.7,
  },
  cardBody: { padding: "0.9rem 1rem", position: "relative" },
  cardTitle: { margin: 0, fontSize: "1.05rem", color: COLORS.carbon },
  cardDesc: { margin: "0.35rem 0 0.5rem", fontSize: "0.9rem", opacity: 0.8, minHeight: "40px" },
  cardPrice: { color: COLORS.terracota, fontWeight: 700, fontSize: "1.1rem" },
  categoriaBadge: {
    padding: "0.3rem 0.6rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginTop: "0.5rem",
    display: "inline-block",
  },
  categoriaBadgeLarge: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    margin: "0.5rem 0",
    display: "inline-block",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    zIndex: 1000,
  },
  detailModal: {
    width: "100%",
    maxWidth: 980,
    backgroundColor: COLORS.hueso,
    borderRadius: 18,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  detailLeft: { backgroundColor: "#fff", minHeight: 360 },
  detailRight: { padding: "1.2rem 1.2rem 1.4rem" },
  detailImage: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.carbon,
    opacity: 0.8,
  },
  detailTitle: { color: COLORS.carbon, marginTop: 0 },
  detailPrice: { color: COLORS.terracota, fontSize: "1.4rem", fontWeight: 700 },
  detailDesc: { lineHeight: 1.5 },
  detailMeta: {
    marginTop: "0.8rem",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  metaItem: {
    background: COLORS.arena,
    padding: "0.35rem 0.6rem",
    borderRadius: 8,
  },
  actions: { marginTop: "1rem", display: "flex", gap: "0.6rem" },
  cta: {
    backgroundColor: COLORS.terracota,
    color: "white",
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: 10,
    cursor: "pointer",
  },
  secondaryBtn: {
    backgroundColor: COLORS.carbon,
    color: "white",
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: 10,
    cursor: "pointer",
    opacity: 0.85,
  },
  loading: { textAlign: "center", margin: "1rem 0" },
  empty: { 
    textAlign: "center", 
    margin: "2rem 0",
    color: COLORS.grisPiedra,
    lineHeight: "1.6",
  },
  resetFiltersBtn: {
    background: COLORS.terracota,
    color: "white",
    border: "none",
    padding: "0.8rem 1.5rem",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "1rem",
    fontSize: "0.9rem",
  },
};