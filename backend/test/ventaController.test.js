import { jest } from "@jest/globals";

// Mocks ESM antes de importar el controlador
const clientMock = { query: jest.fn(), release: jest.fn() };
const poolQueryMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  pool: {
    connect: jest.fn(async () => clientMock),
    query: poolQueryMock,
  },
}));

// Mock UUID para codigo_venta estable
// Mock barcode generator to return a deterministic EAN-13 code
const MOCK_BARCODE = "7501234567897";
await jest.unstable_mockModule("../utils/barcode.js", () => ({
  generateUniqueTicketBarcode: async () => MOCK_BARCODE,
}));

const ventaCtrl = await import("../controllers/ventaController.js");
const {
  crearVenta,
  obtenerVentaPorCodigo,
  deshacerVenta,
  actualizarVentaPorCodigo,
  anularProductosPorCodigo,
  generarReporte,
} = ventaCtrl;

describe("Venta Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientMock.query.mockReset();
    poolQueryMock.mockReset();
  });

  describe("crearVenta", () => {
    it("registra una venta correctamente", async () => {
      const req = {
        body: {
          tipo_pago: "Efectivo",
          productos: [{ codigo_barras: "1234567890123", cantidad: 2 }],
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/INSERT INTO venta/i.test(sql)) return { rows: [{ id_venta: 10, fecha: "2025-10-20" }] };
        if (/INSERT INTO ticket \(codigo_venta, id_venta\)/i.test(sql)) return { rows: [{ id_ticket: 77 }] };
        if (/FROM codigo_barras cb\s+JOIN producto pr/i.test(sql) && /WHERE cb.codigo = \$1/i.test(sql)) {
          return { rowCount: 1, rows: [{ id_producto: 5, stock_actual: 10, precio: 3.5, nombre: "Jarrón" }] };
        }
        if (/INSERT INTO ticket_producto/i.test(sql)) return {};
        if (/UPDATE producto SET cantidad = cantidad - \$1/i.test(sql)) return {};
        if (/SELECT pr\.nombre, pr\.precio\s+FROM codigo_barras/i.test(sql)) {
          return { rows: [{ nombre: "Jarrón", precio: 3.5 }] };
        }
        if (/^COMMIT/i.test(sql)) return {};
        if (/^ROLLBACK/i.test(sql)) return {};
        return {};
      });

      await crearVenta(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id_venta: 10,
          id_ticket: 77,
          codigo_venta: MOCK_BARCODE,
          productos: [
            expect.objectContaining({ nombre_producto: "Jarrón", cantidad: 2, precio: 3.5 }),
          ],
        })
      );
    });

    it("retorna 404 si un producto no existe", async () => {
      const req = {
        body: { tipo_pago: "Efectivo", productos: [{ codigo_barras: "x", cantidad: 1 }] },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/INSERT INTO venta/i.test(sql)) return { rows: [{ id_venta: 10, fecha: "2025-10-20" }] };
        if (/INSERT INTO ticket \(codigo_venta, id_venta\)/i.test(sql)) return { rows: [{ id_ticket: 77 }] };
        if (/FROM codigo_barras cb\s+JOIN producto pr/i.test(sql)) {
          return { rowCount: 0, rows: [] };
        }
        if (/^ROLLBACK/i.test(sql)) return {};
        return {};
      });

      await crearVenta(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("no encontrado") })
      );
    });

    it("retorna 400 si tipo_pago es inválido", async () => {
      const req = { body: { tipo_pago: "Tarjeta", productos: [{ codigo_barras: "111", cantidad: 1 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await crearVenta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("Tipo de pago") }));
    });

    it("retorna 400 si productos está vacío", async () => {
      const req = { body: { tipo_pago: "Efectivo", productos: [] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await crearVenta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 por stock insuficiente", async () => {
      const req = { body: { tipo_pago: "Efectivo", productos: [{ codigo_barras: "123", cantidad: 5 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/INSERT INTO venta/i.test(sql)) return { rows: [{ id_venta: 10, fecha: "2025-10-20" }] };
        if (/INSERT INTO ticket \(codigo_venta, id_venta\)/i.test(sql)) return { rows: [{ id_ticket: 77 }] };
        if (/FROM codigo_barras cb\s+JOIN producto pr/i.test(sql)) {
          return { rowCount: 1, rows: [{ id_producto: 5, stock_actual: 3, precio: 3.5, nombre: "Jarrón" }] };
        }
        if (/^ROLLBACK/i.test(sql)) return {};
        return {};
      });

      await crearVenta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("Stock insuficiente") }));
    });
  });

  describe("deshacerVenta", () => {
    it("revierte stock y elimina venta por codigo_venta", async () => {
  const req = { params: { codigo_venta: MOCK_BARCODE } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/SELECT id_ticket, id_venta FROM ticket WHERE codigo_venta/i.test(sql)) {
          return { rowCount: 1, rows: [{ id_ticket: 77, id_venta: 10 }] };
        }
        if (/SELECT id_producto, cantidad FROM ticket_producto WHERE id_ticket/i.test(sql)) {
          return { rows: [{ id_producto: 5, cantidad: 2 }] };
        }
        if (/UPDATE producto SET cantidad = cantidad \+ \$1/i.test(sql)) return {};
        if (/DELETE FROM ticket_producto/i.test(sql)) return {};
        if (/DELETE FROM ticket WHERE id_ticket/i.test(sql)) return {};
        if (/DELETE FROM venta WHERE id_venta/i.test(sql)) return {};
        if (/^COMMIT/i.test(sql)) return {};
        return {};
      });

      await deshacerVenta(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ mensaje: expect.any(String), codigo_venta: MOCK_BARCODE, id_venta: 10 })
      );
    });
  });

  describe("obtenerVentaPorCodigo", () => {
    it("devuelve venta y productos por codigo_venta", async () => {
  const req = { params: { codigo_venta: MOCK_BARCODE } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      poolQueryMock.mockImplementation(async (sql, params) => {
        if (/FROM venta v\s+JOIN ticket t/i.test(sql) && /WHERE t\.codigo_venta = \$1/i.test(sql)) {
          return { rowCount: 1, rows: [{ id_venta: 10, fecha: "2025-10-20", tipo_pago: "Efectivo", id_ticket: 77, codigo_venta: MOCK_BARCODE }] };
        }
        if (/FROM ticket_producto tp\s+JOIN producto p/i.test(sql)) {
          return { rows: [{ nombre_producto: "Jarrón", cantidad: 2, precio: 3.5 }] };
        }
        return {};
      });

      await obtenerVentaPorCodigo(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id_venta: 10, productos: [expect.objectContaining({ nombre_producto: "Jarrón" })] })
      );
    });
  });

  describe("compat GET /ventas (obtenerVenta)", () => {
    it("retorna 400 si no envía id_venta ni codigo_venta", async () => {
      const req = { query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await ventaCtrl.obtenerVenta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("actualizarVentaPorCodigo", () => {
    it("actualiza tipo_pago y líneas de productos", async () => {
      const req = {
        params: { codigo_venta: MOCK_BARCODE },
        body: { tipo_pago: "Transacción", productos: [{ nombre_producto: "Jarrón", cantidad: 3 }] },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // getIdVentaFromCodigo usa pool.query
      poolQueryMock.mockImplementation(async (sql, params) => {
        if (/SELECT id_venta FROM ticket WHERE codigo_venta/i.test(sql)) return { rowCount: 1, rows: [{ id_venta: 10 }] };
        if (/SELECT id_producto FROM producto WHERE nombre/i.test(sql)) return { rowCount: 1, rows: [{ id_producto: 5, cantidad: 10 }] };
        return {};
      });

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/UPDATE venta SET tipo_pago = \$1 WHERE id_venta = \$2/i.test(sql)) return {};
        if (/SELECT id_producto, cantidad FROM producto WHERE nombre = \$1/i.test(sql)) return { rowCount: 1, rows: [{ id_producto: 5, cantidad: 10 }] };
        if (/SELECT cantidad FROM ticket_producto WHERE id_producto = \$1 AND id_ticket = \(SELECT id_ticket FROM ticket WHERE id_venta = \$2\)/i.test(sql)) {
          return { rowCount: 0, rows: [] }; // no existe previamente
        }
        if (/INSERT INTO ticket_producto \(id_ticket, id_producto, cantidad\)/i.test(sql)) return {};
        if (/UPDATE producto SET cantidad = cantidad - \$1/i.test(sql)) return {};
        if (/^COMMIT/i.test(sql)) return {};
        return {};
      });

      await actualizarVentaPorCodigo(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ mensaje: expect.any(String), codigo_venta: MOCK_BARCODE })
      );
    });
  });

  describe("anularProductosPorCodigo", () => {
    it("anula cantidades y elimina línea si queda en 0", async () => {
  const req = { params: { codigo_venta: MOCK_BARCODE }, body: { productos: [{ nombre_producto: "Jarrón", cantidad: 2 }] } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      poolQueryMock.mockImplementation(async (sql, params) => {
        if (/SELECT id_venta FROM ticket WHERE codigo_venta/i.test(sql)) return { rowCount: 1, rows: [{ id_venta: 10 }] };
        if (/SELECT id_producto FROM producto WHERE nombre/i.test(sql)) return { rowCount: 1, rows: [{ id_producto: 5 }] };
        return {};
      });

      clientMock.query.mockImplementation(async (sql, params) => {
        if (/^BEGIN/i.test(sql)) return {};
        if (/SELECT cantidad FROM ticket_producto WHERE id_producto = \$1 AND id_ticket = \(SELECT id_ticket FROM ticket WHERE id_venta = \$2\)/i.test(sql)) {
          return { rowCount: 1, rows: [{ cantidad: 2 }] };
        }
        if (/DELETE FROM ticket_producto WHERE id_producto = \$1 AND id_ticket = \(SELECT id_ticket FROM ticket WHERE id_venta = \$2\)/i.test(sql)) return {};
        if (/UPDATE producto SET cantidad = cantidad \+ \$1/i.test(sql)) return {};
        if (/^COMMIT/i.test(sql)) return {};
        return {};
      });

      await anularProductosPorCodigo(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ mensaje: expect.any(String), codigo_venta: MOCK_BARCODE })
      );
    });
  });

  describe("generarReporte errores", () => {
    it("retorna 400 si faltan fechas", async () => {
      const req = { query: { fecha_inicio: "2025-01-01" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await generarReporte(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("generarReporte", () => {
    it("retorna totales y agregados", async () => {
      const req = { query: { fecha_inicio: "2025-01-01", fecha_fin: "2025-12-31" } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      poolQueryMock.mockImplementation(async (sql, params) => {
        if (/SELECT SUM\(p\.precio \* tp\.cantidad\)/i.test(sql)) return { rows: [{ total_vendido: 100 }] };
        if (/SELECT p\.nombre, SUM\(tp\.cantidad\)/i.test(sql)) return { rows: [{ nombre: "Jarrón", total_cantidad: 3 }] };
        if (/SELECT tipo_pago, COUNT\(\*\)/i.test(sql)) return { rows: [{ tipo_pago: "Efectivo", total: 1 }] };
        return {};
      });

      await generarReporte(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ total_vendido: 100, productos_mas_vendidos: expect.any(Array), tipo_pago_mas_usado: expect.any(Array) })
      );
    });
  });
});
