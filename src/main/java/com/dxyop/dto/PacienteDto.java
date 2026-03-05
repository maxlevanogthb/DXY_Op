package com.dxyop.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteDto {
    private Long id;
    private String nombre;
    private String telefono;
    private String email;
    
    // ==========================================
    // NUEVO: LA BANDERA DEL MINI-CRM
    // ==========================================
    private boolean esPacienteOficial; 
    
    // FECHAS
    private LocalDate fechaNacimiento;
    private LocalDate fechaRegistro;
    
    // DATOS CLÍNICOS
    private String motivo;
    private String graduacionActual;
}