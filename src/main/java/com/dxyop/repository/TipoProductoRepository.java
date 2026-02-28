package com.dxyop.repository;
import com.dxyop.model.TipoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TipoProductoRepository extends JpaRepository<TipoProducto, Long> {
    List<TipoProducto> findByActivoTrueOrderByNombre();
    List<TipoProducto> findByNombreContainingIgnoreCase(String nombre);
}
