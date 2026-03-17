package com.dxyop.service;

import com.dxyop.dto.PagoDto;
import com.dxyop.model.Consulta;
import com.dxyop.model.Pago;
import com.dxyop.repository.ConsultaRepository;
import com.dxyop.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final ConsultaRepository consultaRepository;

    /**
     * Registra un pago y actualiza automáticamente los saldos de la consulta.
     * Funciona tanto para anticipos nuevos como para abonos posteriores.
     */
    @Transactional
    public Pago registrarPago(PagoDto dto) {
        // 1. Buscar la consulta
        Consulta consulta = consultaRepository.findById(dto.getConsultaId())
                .orElseThrow(() -> new RuntimeException("Consulta no encontrada"));

        // Obtenemos el valor de 'aCuenta' de forma segura (0.0 si es null)
        Double aCuentaActual = consulta.getACuenta() != null ? consulta.getACuenta() : 0.0;
        long pagosEnHistorial = pagoRepository.countByConsultaId(consulta.getId());

        if (pagosEnHistorial == 0 && aCuentaActual > 0) {
            System.out.println("MIGRANDO SALDO HISTÓRICO: $" + aCuentaActual);
            
            Pago pagoLegacy = new Pago();
            pagoLegacy.setConsulta(consulta);
            pagoLegacy.setMonto(aCuentaActual);
            pagoLegacy.setMetodoPago("Efectivo"); // Asumimos efectivo para datos viejos
            pagoLegacy.setNotas("Saldo inicial (Migración automática)");
            // Usamos la fecha de registro original para no alterar el corte de caja de hoy
            pagoLegacy.setFechaPago(consulta.getFechaRegistro() != null ? 
                                    consulta.getFechaRegistro() : LocalDateTime.now());
            
            pagoRepository.saveAndFlush(pagoLegacy); 
        }

        // Registramos el NUEVO pago 
        Pago nuevoPago = new Pago();
        nuevoPago.setConsulta(consulta);
        nuevoPago.setMonto(dto.getMonto());
        nuevoPago.setMetodoPago(dto.getMetodoPago());
        nuevoPago.setNotas(dto.getNotas());
        // Si no viene fecha (ej. es un abono rápido), usamos now
        nuevoPago.setFechaPago(dto.getFechaPago() != null ? dto.getFechaPago() : LocalDateTime.now());

        Pago pagoGuardado = pagoRepository.save(nuevoPago);

        // Recalcular saldos MATEMÁTICAMENTE
        actualizarEstadoFinanciero(consulta);

        return pagoGuardado;
    }


    private void actualizarEstadoFinanciero(Consulta consulta) {
        // Sumamos lo que hay en la tabla de pagos para esta consulta
        List<Pago> historial = pagoRepository.findByConsultaIdOrderByFechaPagoDesc(consulta.getId());
        
        double totalPagadoReal = historial.stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        // Validamos el total presupuesto por si es nulo
        double totalPresupuesto = consulta.getTotalPresupuesto() != null ? consulta.getTotalPresupuesto() : 0.0;

        // Calculamos el restante
        double nuevoRestante = totalPresupuesto - totalPagadoReal;

        //Actualizamos la Consulta
        consulta.setACuenta(totalPagadoReal);
        // Usamos Math.max para que nunca guarde números negativos (-0.01) por errores de redondeo
        consulta.setRestante(Math.max(0.0, nuevoRestante));

        consultaRepository.save(consulta);
    }

    // Método para obtener reporte del día (Corte de Caja)
    public List<Pago> obtenerVentasDelDia() {
        LocalDateTime inicio = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime fin = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        return pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin);
    }
}