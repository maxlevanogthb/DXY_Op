package com.dxyop.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.dxyop.model.RazonVisita;

public interface RazonVisitaRepository extends JpaRepository<RazonVisita, Long> {
    List<RazonVisita> findByActivoTrueOrderByNombreAsc();
}