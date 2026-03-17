package com.dxyop.repository;

import com.dxyop.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    List<Producto> findByActivoTrue();

    List<Producto> findByTipoNombreAndActivoTrue(String nombreTipo);

    List<Producto> findBySubTipoAndStockGreaterThan(String subTipo, Integer stockMinimo);

    @Query("SELECT DISTINCT p.marca FROM Producto p WHERE p.tipo.nombre = :tipoNombre AND p.activo = true ORDER BY p.marca")
    List<String> findMarcasByTipo(String tipoNombre);

    @Query("SELECT DISTINCT p.modelo FROM Producto p WHERE p.marca = :marca AND p.activo = true ORDER BY p.modelo")
    List<String> findModelosByMarca(String marca);

    @Query("SELECT DISTINCT p.color FROM Producto p WHERE p.marca = :marca AND p.modelo = :modelo AND p.activo = true")
    List<String> findColoresByModelo(String marca, String modelo);

    @Query("SELECT DISTINCT p.talla FROM Producto p WHERE p.marca = :marca AND p.modelo = :modelo AND p.color = :color AND p.activo = true")
    List<String> findTallasByColor(String marca, String modelo, String color);

    Producto findByMarcaAndModeloAndColorAndTallaAndActivoTrue(String marca, String modelo, String color, String talla);

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.stock <= :stockMinimo AND p.activo = true")
    Long contarProductosBajoStock(Integer stockMinimo);
}