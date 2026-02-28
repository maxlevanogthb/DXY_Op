package com.dxyop.repository;

import com.dxyop.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    // 1. Para el catálogo general (solo activos)
    List<Producto> findByActivoTrue();

    // 2. Buscar por nombre de tipo (ej: "Armazon", "Mica")
    // JPA es inteligente: busca en la relación 'tipo' el campo 'nombre'
    List<Producto> findByTipoNombreAndActivoTrue(String nombreTipo);

    // 3. Para el módulo de CONSULTAS (Filtrado cascada)
    // Busca por subTipo (ej: "Ranurado") y que tenga stock
    List<Producto> findBySubTipoAndStockGreaterThan(String subTipo, Integer stockMinimo);

    // 1. Obtener todas las MARCAS disponibles de una categoría (ej: Armazón)
    @Query("SELECT DISTINCT p.marca FROM Producto p WHERE p.tipo.nombre = :tipoNombre AND p.activo = true ORDER BY p.marca")
    List<String> findMarcasByTipo(String tipoNombre);

    // 2. Obtener MODELOS de una Marca específica
    @Query("SELECT DISTINCT p.modelo FROM Producto p WHERE p.marca = :marca AND p.activo = true ORDER BY p.modelo")
    List<String> findModelosByMarca(String marca);

    // 3. Obtener COLORES de un Modelo específico
    @Query("SELECT DISTINCT p.color FROM Producto p WHERE p.marca = :marca AND p.modelo = :modelo AND p.activo = true")
    List<String> findColoresByModelo(String marca, String modelo);

    // 4. Obtener TALLAS de un Modelo y Color específico
    @Query("SELECT DISTINCT p.talla FROM Producto p WHERE p.marca = :marca AND p.modelo = :modelo AND p.color = :color AND p.activo = true")
    List<String> findTallasByColor(String marca, String modelo, String color);

    // 5. Encontrar el PRODUCTO FINAL específico (SKU)
    Producto findByMarcaAndModeloAndColorAndTallaAndActivoTrue(String marca, String modelo, String color, String talla);

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stock <= :stockMinimo AND p.activo = true")
    Long contarProductosBajoStock(Integer stockMinimo);
}