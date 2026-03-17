package com.dxyop.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dxyop.model.OpcionLente;

@Repository
public interface OpcionLenteRepository extends JpaRepository<OpcionLente, Long> {

    List<OpcionLente> findByCategoriaOrderByPrecioBaseAsc(String categoria);
    
}
