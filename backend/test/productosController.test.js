// tests/productosController.combined.test.js
import { jest } from "@jest/globals";
import * as productosController from "../controllers/productoController.js";
import {
  sanitizeProductName,
  calcularCheckDigitEAN13,
  generarDigitosAleatorios,
} from "../controllers/productoController.js";

// -------------------- Helper Functions Tests --------------------
describe("Helper Functions", () => {
  // --- sanitizeProductName ---
  describe("sanitizeProductName", () => {
    test("debe eliminar espacios y caracteres especiales", () => {
      expect(sanitizeProductName(" Café con leche! ")).toBe("Caf_con_leche");
    });

    test("debe devolver 'imagen' si el valor es null o no string", () => {
      expect(sanitizeProductName(null)).toBe("imagen");
      expect(sanitizeProductName(123)).toBe("imagen");
    });

    test("debe reemplazar espacios por guiones bajos", () => {
      expect(sanitizeProductName("Mi Producto Nuevo")).toBe("Mi_Producto_Nuevo");
    });
  });

  // --- calcularCheckDigitEAN13 ---
  describe("calcularCheckDigitEAN13", () => {
    test("debe calcular correctamente el dígito verificador EAN-13", () => {
      const base = "123456789012";
      expect(calcularCheckDigitEAN13(base)).toBe(8);
    });

    test("debe lanzar error si la base no tiene 12 dígitos", () => {
      expect(() => calcularCheckDigitEAN13("123")).toThrow();
    });

    test("debe lanzar error si hay caracteres no numéricos", () => {
      expect(() => calcularCheckDigitEAN13("ABCDEFGHIJKL")).toThrow();
    });
  });

  // --- generarDigitosAleatorios ---
  describe("generarDigitosAleatorios", () => {
    test("debe generar un string de longitud específica", () => {
      const resultado = generarDigitosAleatorios(10);
      expect(resultado).toHaveLength(10);
    });

    test("debe contener solo números", () => {
      const resultado = generarDigitosAleatorios(6);
      expect(/^\d+$/.test(resultado)).toBe(true);
    });

    test("debe generar valores diferentes cada vez", () => {
      const a = generarDigitosAleatorios(8);
      const b = generarDigitosAleatorios(8);
      expect(a).not.toBe(b);
    });
  });
});

// -------------------- Controller Tests --------------------
const clientMock = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock de pool.connect() correctamente
jest.mock("../config/db.js", () => ({
  pool: {
    connect: jest.fn(async () => clientMock),
  },
}));

describe("Productos Controller - DB Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- crearProducto ----
  describe("crearProducto", () => {
    it("debe crear un producto correctamente", async () => {
      const req = { body: { nombre: "Test Product", cantidad: 5, precio: 10.5 }, file: null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // MOCK: flujo de creación de producto
      clientMock.query
        .mockResolvedValueOnce({ rowCount: 0 }) // Verificar si existe
        .mockResolvedValueOnce({ rows: [{ id_producto: 1 }] }) // Insert producto
        .mockResolvedValueOnce({ rowCount: 0 }) // Verificar EAN
        .mockResolvedValueOnce({}); // Insert códigos

      await productosController.crearProducto(req, res);

      expect(clientMock.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id_producto: 1,
          codigo_barras: expect.any(String),
          codigo_qr: expect.any(String),
        })
      );
    });

    it("debe devolver 409 si el producto ya existe", async () => {
      const req = { body: { nombre: "Test", cantidad: 1, precio: 1 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_producto: 1 }] });

      await productosController.crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  // ---- actualizarStock ----
  describe("actualizarStock", () => {
    it("debe actualizar correctamente el stock", async () => {
      const req = { params: { id_producto: 1 }, body: { cantidad: 3 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // MOCK: producto existe
      clientMock.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ cantidad: 2 }] }) // SELECT actual
        .mockResolvedValueOnce({ rows: [{ cantidad: 5 }] }); // UPDATE stock

      await productosController.actualizarStock(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Stock actualizado correctamente",
        nuevaCantidad: 5,
      });
    });
  });

  // ---- eliminarProducto ----
  describe("eliminarProducto", () => {
    it("debe eliminar un producto correctamente", async () => {
      const req = { params: { id_producto: 1 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_producto: 1, imagen_url: null }] }) // SELECT
        .mockResolvedValue({}); // DELETE

      await productosController.eliminarProducto(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Producto eliminado correctamente",
        id_producto: 1,
      });
    });
  });

  // ---- actualizarDetalles ----
  describe("actualizarDetalles", () => {
    it("debe actualizar detalles del producto", async () => {
      const req = { params: { id_producto: 1 }, body: { nombre: "Nuevo Nombre" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      clientMock.query
        .mockResolvedValueOnce({ rowCount: 0 }) // Verificar duplicado
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_producto: 1, nombre: "Nuevo Nombre" }] }); // UPDATE

      await productosController.actualizarDetalles(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Producto actualizado correctamente",
        producto: expect.objectContaining({ nombre: "Nuevo Nombre" }),
      });
    });
  });
});
