package com.dxyop.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDto {
private Long id;
    private String nombre;
    private String telefono;
    private String email;
    
    // AGREGA ESTOS DOS CAMPOS:
    private LocalDate fechaNacimiento;
    private LocalDate fechaRegistro;
    
    // ... otros campos que tengas (motivo, graduacion, etc.)
    private String motivo;
    private String graduacionActual;
}
