package com.dxyop.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PagoDto {
    private Long consultaId;
    private Double monto;
    private String metodoPago; // "Efectivo", "Tarjeta", etc.
    private String notas;
    private LocalDateTime fechaPago; // Opcional, si es fecha retroactiva
}
