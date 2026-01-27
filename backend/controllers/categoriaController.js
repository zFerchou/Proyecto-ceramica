import Categoria from '../models/Categoria.js';

export class CategoriaController {
  
  // Obtener todas las categorías
  static async getAllCategorias(req, res) {
    try {
      const categorias = await Categoria.obtenerTodas();
      res.json(categorias);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }

  // Obtener categoría por ID
  static async getCategoriaById(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.obtenerPorId(parseInt(id));
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      res.json(categoria);
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }

  // Crear nueva categoría
  static async createCategoria(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
      }

      const nuevaCategoria = await Categoria.crear(nombre, descripcion);

      res.status(201).json({
        message: 'Categoría creada exitosamente',
        categoria: nuevaCategoria
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      
      if (error.message === 'Ya existe una categoría con este nombre') {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }

  // Actualizar categoría
  static async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      // Validaciones
      if (nombre && nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre de la categoría no puede estar vacío' });
      }

      const categoriaActualizada = await Categoria.actualizar(
        parseInt(id), 
        nombre, 
        descripcion
      );

      res.json({
        message: 'Categoría actualizada exitosamente',
        categoria: categoriaActualizada
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      
      if (error.message === 'Categoría no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Ya existe otra categoría con este nombre') {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }

  // Eliminar categoría (borrado lógico)
  static async deleteCategoria(req, res) {
    try {
      const { id } = req.params;

      const categoriaEliminada = await Categoria.eliminar(parseInt(id));

      res.json({ 
        message: 'Categoría eliminada exitosamente',
        categoria: categoriaEliminada
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      
      if (error.message === 'Categoría no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return res.status(409).json({ 
          error: error.message,
          message: 'La categoría está siendo utilizada por productos existentes'
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }

  // Restaurar categoría eliminada
  static async restoreCategoria(req, res) {
    try {
      const { id } = req.params;

      const categoriaRestaurada = await Categoria.restaurar(parseInt(id));

      res.json({ 
        message: 'Categoría restaurada exitosamente',
        categoria: categoriaRestaurada
      });
    } catch (error) {
      console.error('Error al restaurar categoría:', error);
      
      if (error.message === 'Categoría no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
}

export default CategoriaController;