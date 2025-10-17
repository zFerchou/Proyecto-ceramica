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

export default function ProductosView() {
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

  // --- Filtrar productos por búsqueda ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.descripcion || "").toLowerCase().includes(q)
    );
  }, [productos, query]);

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
          <h1 style={styles.title}>Colección Santo Barro</h1>
          <p style={styles.subtitle}>Piezas únicas hechas a mano</p>
          <div style={styles.searchRow}>
            <input
              aria-label="Buscar productos"
              placeholder="Buscar por nombre o descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </header>

        {/* --- Mensajes de estado --- */}
        {error && <div style={styles.errorBox}>{String(error)}</div>}
        {loading && <div style={styles.loading}>Cargando productos...</div>}
        {!loading && filtered.length === 0 && (
          <div style={styles.empty}>No se encontraron productos.</div>
        )}

        {/* --- Grid de productos --- */}
        <section style={styles.grid}>
          {filtered.map((p, idx) => (
            <article
              key={(p.id_producto ?? idx) + "_" + p.nombre}
              style={{
                ...styles.card,
                ...(hoverIdx === idx ? styles.cardHover : {}),
              }}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelected(p);
              }}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoverIdx(idx)}
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
                        e.currentTarget.src = ""; // hide if missing
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
              </div>
            </article>
          ))}
        </section>
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

              {/* Código de barras removido en ProductosView por solicitud. */}

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
                {selected.id_categoria != null && (
                  <span style={styles.metaItem}>
                    <strong>Categoría ID:</strong> {selected.id_categoria}
                  </span>
                )}
              </div>

              {/* --- Acciones --- */}
              <div style={styles.actions}>
                <button
                  style={styles.cta}
                  onClick={() =>
                    window.open(
                      `${process.env.REACT_APP_API_BASE}${selected.qr_image_path.replace(/^\/public/, "")}`,
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

// --- Estilos en objeto ---
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
  searchRow: { marginTop: "1rem", display: "flex", justifyContent: "center" },
  searchInput: {
    width: "100%",
    maxWidth: 520,
    padding: "0.8rem 1rem",
    borderRadius: 12,
    border: `1px solid ${COLORS.arena}`,
    backgroundColor: "#fff",
    outline: "none",
    color: COLORS.carbon,
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
    border: `1px solid ${COLORS.carbon}20`,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition:
      "transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease",
  },
  cardHover: {
    transform: "translateY(-2px)",
    backgroundColor: COLORS.hoverSand,
    boxShadow:
      "0 10px 24px rgba(176,131,106,0.35), 0 0 0 2px rgba(176,131,106,0.35)",
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
  cardBody: { padding: "0.9rem 1rem" },
  cardTitle: { margin: 0, fontSize: "1.05rem", color: COLORS.carbon },
  cardDesc: { margin: "0.35rem 0 0.5rem", fontSize: "0.9rem", opacity: 0.8 },
  cardPrice: { color: COLORS.terracota, fontWeight: 700 },
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
  empty: { textAlign: "center", margin: "1rem 0" },
};
