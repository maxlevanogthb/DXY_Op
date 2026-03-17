package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tipos_producto")
@Data
public class TipoProducto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String nombre;  
    
    @Column(length = 100)
    private String descripcion;  
    
    @Column(length = 60)
    private String icono;  // "fas fa-glasses", "fas fa-palette"
    
    private boolean activo = true;
    
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
