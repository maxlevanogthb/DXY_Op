package com.dxyop.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "pagos")
@Data
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double monto;

    // Efectivo, Tarjeta, Transferencia, Cheque
    @Column(name = "metodo_pago", nullable = false)
    private String metodoPago;

    @Column(columnDefinition = "TEXT")
    private String notas; // "Referencia #1234" o "Abono de mi tía"

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    // RELACIÓN CON LA CONSULTA (Padre)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id", nullable = false)
    @JsonIgnore             // <--- ESCUDO PARA EL JSON
    @ToString.Exclude       // <--- ESCUDO PARA LOMBOK
    @EqualsAndHashCode.Exclude // <--- ESCUDO PARA LOMBOK
    private Consulta consulta;

    @PrePersist
    protected void onCreate() {
        // Si no mandan fecha, ponemos la actual
        if (this.fechaPago == null) {
            this.fechaPago = LocalDateTime.now();
        }
    }

    // --- PUENTE SEGURO PARA EL FRONTEND ---
    @JsonProperty("pacienteNombre")
    public String getPacienteNombre() {
        if (this.consulta != null && this.consulta.getPaciente() != null) {
            return this.consulta.getPaciente().getNombre();
        }
        return "General";
    }

    @JsonProperty("aplicaIva")
    public boolean isAplicaIva() {
        if (this.consulta != null && this.consulta.getAplicarIva() != null) {
            return this.consulta.getAplicarIva();
        }
        return false;
    }
}