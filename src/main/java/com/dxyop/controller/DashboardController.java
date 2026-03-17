package com.dxyop.controller;

import com.dxyop.repository.ConsultaRepository;
import com.dxyop.repository.PagoRepository;
import com.dxyop.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final PagoRepository pagoRepository;
    private final ConsultaRepository consultaRepository;
    private final ProductoRepository productoRepository;

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKpis() {
        Map<String, Object> kpis = new HashMap<>();

        // Calculamos las fechas del mes actual (Desde el día 1 hasta hoy)
        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMes = LocalDate.now().atTime(LocalTime.MAX);
        LocalDate inicioMesDate = LocalDate.now().withDayOfMonth(1);
        LocalDate finMesDate = LocalDate.now();

        // Ingresos del Mes (Suma de Pagos reales)
        Double ingresos = pagoRepository.sumarVentasPorRango(inicioMes, finMes);
        kpis.put("ingresosMes", ingresos != null ? ingresos : 0.0);

        // Cuentas por Cobrar (Todo el dinero en la calle)
        Double cuentasCobrar = consultaRepository.sumarCuentasPorCobrar();
        kpis.put("cuentasPorCobrar", cuentasCobrar != null ? cuentasCobrar : 0.0);

        // Pacientes Atendidos en el mes
        Long pacientesAtendidos = consultaRepository.contarConsultasPorRango(inicioMesDate, finMesDate);
        kpis.put("pacientesAtendidos", pacientesAtendidos != null ? pacientesAtendidos : 0L);

        // Trabajos Pendientes en laboratorio
        Long pendientes = consultaRepository.contarTrabajosPendientes();
        kpis.put("trabajosPendientes", pendientes != null ? pendientes : 0L);

        //Productos con stock de 2 o menos
        Long stockCritico = productoRepository.contarProductosBajoStock(2);
        kpis.put("stockCritico", stockCritico != null ? stockCritico : 0L);

        // ---DATOS PARA LA GRÁFICA DE BARRAS (Últimos 7 días) ---
        java.util.List<String> labelsDias = new java.util.ArrayList<>();
        java.util.List<Double> datosDias = new java.util.ArrayList<>();
        
        // Formateador para poner "Lun", "Mar", etc.
        java.time.format.DateTimeFormatter formatoDia = java.time.format.DateTimeFormatter.ofPattern("EEE dd", new java.util.Locale("es", "MX"));

        for (int i = 6; i >= 0; i--) {
            LocalDate dia = LocalDate.now().minusDays(i);
            LocalDateTime inicioDia = dia.atStartOfDay();
            LocalDateTime finDia = dia.atTime(LocalTime.MAX);
            
            Double sumaDia = pagoRepository.sumarVentasPorRango(inicioDia, finDia);
            
            labelsDias.add(dia.format(formatoDia)); 
            datosDias.add(sumaDia != null ? sumaDia : 0.0);
        }
        kpis.put("labelsDias", labelsDias);
        kpis.put("datosDias", datosDias);

        java.util.List<Object[]> categorias = consultaRepository.sumarVentasPorCategoria(inicioMesDate);
        java.util.List<String> labelsCat = new java.util.ArrayList<>();
        java.util.List<Double> datosCat = new java.util.ArrayList<>();
        
        for (Object[] row : categorias) {
            labelsCat.add((String) row[0]); 
            datosCat.add((Double) row[1]);  
        }
        kpis.put("labelsCat", labelsCat);
        kpis.put("datosCat", datosCat);

        java.util.List<com.dxyop.model.Consulta> topDeudoresRaw = consultaRepository.findTop5ByRestanteGreaterThanOrderByRestanteDesc(0.0);
        java.util.List<Map<String, Object>> topDeudores = new java.util.ArrayList<>();
        
        for(com.dxyop.model.Consulta c : topDeudoresRaw) {
            Map<String, Object> deudor = new HashMap<>();
            deudor.put("id", c.getId());
            deudor.put("paciente", c.getPaciente().getNombre());
            deudor.put("telefono", c.getPaciente().getTelefono());
            deudor.put("email", c.getPaciente().getEmail());
            deudor.put("fecha", c.getFechaVisita());
            deudor.put("restante", c.getRestante());
            topDeudores.add(deudor);
        }
        kpis.put("topDeudores", topDeudores);

        return ResponseEntity.ok(kpis);
    }
}