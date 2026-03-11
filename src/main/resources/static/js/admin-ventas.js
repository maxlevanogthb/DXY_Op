// ==========================================
// 0. CONFIGURACIÓN DINÁMICA CHART.JS (MODO OSCURO)
// ==========================================
const esModoOscuro = localStorage.getItem('dxy_dark') === 'true';
const colorTexto = esModoOscuro ? '#e0e0e0' : '#666';
const colorLineas = esModoOscuro ? '#444444' : '#e0e0e0';

// Solo aplicamos si Chart.js está cargado en la vista
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = colorTexto;
    Chart.defaults.borderColor = colorLineas;
}

// ==========================================
// 1. CONSTANTES Y VARIABLES GLOBALES
// ==========================================
const API_PENDIENTES = "/api/consultas/pendientes";
const API_FINALIZADAS = "/api/consultas/finalizadas";
const API_PAGOS = "/api/pagos"; // Para guardar y consultar corte de caja

let tablaPendientes;
let tablaFinalizadas;
let modalAbono;
let modalHistorial;

// Formateador de dinero (MXN)
const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
});

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar Modales de Bootstrap
    modalAbono = new bootstrap.Modal(document.getElementById('modalAbono'));
    modalHistorial = new bootstrap.Modal(document.getElementById('modalHistorialPagos'));

    // Cargar Tablas
    inicializarTablaPendientes();
    inicializarTablaFinalizadas();
    
    // Cargar Corte de Caja Inicial
    cargarCorteCaja();

    if (document.getElementById("graficaIngresos")) {
        cargarDashboard();
    }
});

// ==========================================
// 3. TABLA DE CUENTAS POR COBRAR (PENDIENTES)
// ==========================================
function inicializarTablaPendientes() {
    if ($.fn.DataTable.isDataTable('#tablaPendientes')) {
        $('#tablaPendientes').DataTable().destroy();
    }

    tablaPendientes = $("#tablaPendientes").DataTable({
        ajax: { url: API_PENDIENTES, dataSrc: "" },
        columns: [
            // 1. FECHA
            { 
                data: "fechaVisita",
                render: (data) => {
                    if(!data) return "-";
                    const [y, m, d] = data.split('-');
                    return `${d}/${m}/${y}`;
                }
            },
            // 2. CLIENTE
            { 
                data: "cliente",
                render: (data) => `<span class="fw-bold text-primary">${data.nombre}</span>`
            },
            // 3. TOTAL VENTA
            { 
                data: "totalPresupuesto",
                className: "text-end",
                render: (data) => formatter.format(data)
            },
            // 4. ÚLTIMO ABONO (LÓGICA ESPECIAL)
            {
                data: "pagos", // Accedemos a la lista de pagos
                className: "text-center bg-warning bg-opacity-10",
                render: (pagos) => {
                    if (!pagos || pagos.length === 0) {
                        return '<span class="badge bg-secondary text-white small">Sin abonos</span>';
                    }
                    // Ordenamos por fecha descendente (el más nuevo primero) en JS por seguridad
                    const ultimo = pagos.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];
                    
                    const fecha = new Date(ultimo.fechaPago).toLocaleDateString();
                    return `
                        <div class="lh-1">
                            <div class="fw-bold text-dark">${formatter.format(ultimo.monto)}</div>
                            <small class="text-muted" style="font-size: 0.75rem;">${fecha}</small>
                        </div>
                    `;
                }
            },
            // 5. DEUDA ACTUAL
            { 
                data: "restante",
                className: "text-end fw-bold text-danger",
                render: (data) => formatter.format(data)
            },
            // 6. ACCIONES
            {
                data: null,
                className: "text-center",
                orderable: false,
                render: (data, type, row) => `
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success shadow-sm" onclick="abrirModalAbono(${row.id}, '${row.cliente.nombre}', ${row.totalPresupuesto}, ${row.restante})" title="Cobrar">
                            <i class="fas fa-hand-holding-usd"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="verHistorial(${row.id}, '${row.cliente.nombre}', ${row.totalPresupuesto})" title="Ver Historial">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                `
            }
        ],
        language: { url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
        // Actualizar KPI de Deuda Total al cargar la tabla
        drawCallback: function () {
            const datos = this.api().data().toArray();
            const totalDeuda = datos.reduce((acc, curr) => acc + (curr.restante || 0), 0);
            $("#kpiPorCobrar").text(formatter.format(totalDeuda));
        }
    });
}

// ==========================================
// 4. TABLA DE VENTAS FINALIZADAS
// ==========================================
function inicializarTablaFinalizadas() {
    if ($.fn.DataTable.isDataTable('#tablaFinalizadas')) {
        $('#tablaFinalizadas').DataTable().destroy();
    }

    tablaFinalizadas = $("#tablaFinalizadas").DataTable({
        ajax: { url: API_FINALIZADAS, dataSrc: "" },
        columns: [
            { 
                data: "fechaVisita",
                render: (data) => {
                    const [y, m, d] = data.split('-');
                    return `${d}/${m}/${y}`;
                }
            },
            { 
                data: "cliente",
                render: (data) => `<span class="fw-bold">${data.nombre}</span>`
            },
            { data: "razonVisita" }, // Ej: Venta de Lentes, Reparación
            { 
                data: "totalPresupuesto", // En finalizadas, el total cobrado es el presupuesto
                className: "text-end fw-bold text-success",
                render: (data) => formatter.format(data)
            },
            {
                data: null,
                className: "text-center",
                render: (data, type, row) => `
                    <button class="btn btn-sm btn-outline-secondary" onclick="verHistorial(${row.id}, '${row.cliente.nombre}', ${row.totalPresupuesto})">
                        <i class="fas fa-list-ul me-1"></i>Detalles
                    </button>
                `
            }
        ],
        language: { url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" }
    });
}

// ==========================================
// 5. LÓGICA DE CORTE DE CAJA (HOY)
// ==========================================
function cargarCorteCaja() {
    fetch(`${API_PAGOS}/hoy`)
        .then(res => res.json())
        .then(pagos => {
            const tbody = $("#tablaCorteCaja tbody");
            tbody.empty();

            let totalHoy = 0;

            if(pagos.length === 0) {
                tbody.append('<tr><td colspan="5" class="text-center text-muted py-3">No hay movimientos registrados hoy</td></tr>');
            } else {
                pagos.forEach(p => {
                    totalHoy += p.monto;
                    const hora = new Date(p.fechaPago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const cliente = p.consulta && p.consulta.cliente ? p.consulta.cliente.nombre : "Cliente General";
                    
                    // Icono según método
                    let iconoMetodo = '<i class="fas fa-money-bill text-success"></i>';
                    if(p.metodoPago === 'Tarjeta') iconoMetodo = '<i class="fas fa-credit-card text-primary"></i>';
                    if(p.metodoPago === 'Transferencia') iconoMetodo = '<i class="fas fa-university text-info"></i>';

                    tbody.append(`
                        <tr>
                            <td><span class="badge bg-secondary">${hora}</span></td>
                            <td class="fw-medium">${cliente}</td>
                            <td class="small text-muted">${p.notas || 'Abono'}</td>
                            <td>${iconoMetodo} ${p.metodoPago}</td>
                            <td class="text-end fw-bold text-success">+${formatter.format(p.monto)}</td>
                        </tr>
                    `);
                });
            }

            // Actualizar KPI Grande
            $("#kpiVentaHoy").text(formatter.format(totalHoy));
        })
        .catch(err => console.error("Error cargando caja", err));
}

// ==========================================
// 6. MODAL: REGISTRAR ABONO
// ==========================================
function abrirModalAbono(consultaId, clienteNombre, total, deuda) {
    $("#abono_consultaId").val(consultaId);
    $("#abono_clienteNombre").val(clienteNombre);
    
    $("#abono_totalDisplay").text(formatter.format(total));
    $("#abono_deudaDisplay").text(formatter.format(deuda));
    $("#abono_deudaReal").val(deuda); // Guardamos valor numérico para validar
    
    $("#abono_monto").val(""); 
    $("#abono_notas").val("");
    $("#abono_monto").attr("max", deuda); // HTML5 Validation

    modalAbono.show();
    setTimeout(() => $("#abono_monto").focus(), 500); 
}

function guardarAbono() {
    const consultaId = $("#abono_consultaId").val();
    const monto = parseFloat($("#abono_monto").val());
    const deuda = parseFloat($("#abono_deudaReal").val());

    // Validaciones Frontend
    if (!monto || monto <= 0) {
        Swal.fire("Atención", "Ingresa un monto válido mayor a 0", "warning");
        return;
    }
    // Permitimos un margen de error de 1 peso por decimales, pero idealmente no debe exceder
    if (monto > deuda + 1) { 
        Swal.fire("Error", `El monto excede la deuda actual (${formatter.format(deuda)})`, "error");
        return;
    }

    const pagoDto = {
        consultaId: parseInt(consultaId),
        monto: monto,
        metodoPago: $("#abono_metodo").val(),
        notas: $("#abono_notas").val()
    };

    // Botón loading...
    const btn = document.querySelector("#modalAbono .btn-success");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    fetch(API_PAGOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagoDto)
    })
    .then(res => {
        if(res.ok) return res.json();
        throw new Error("Error en servidor");
    })
    .then(data => {
        modalAbono.hide();
        Swal.fire({
            icon: 'success',
            title: '¡Pago Registrado!',
            text: `Se recibieron ${formatter.format(monto)} correctamente.`,
            timer: 2000,
            showConfirmButton: false
        });
        
        // RECARGAR TODO
        tablaPendientes.ajax.reload(null, false);
        tablaFinalizadas.ajax.reload(null, false);
        cargarCorteCaja();
    })
    .catch(err => {
        console.error(err);
        Swal.fire("Error", "No se pudo registrar el pago.", "error");
    })
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// ==========================================
// 7. MODAL: VER HISTORIAL DETALLADO
// ==========================================
function verHistorial(consultaId, clienteNombre, totalVenta) {
    $("#historial_cliente").text(`Cliente: ${clienteNombre}`);
    $("#historial_total").text(`Total Venta: ${formatter.format(totalVenta)}`);
    
    const tbody = $("#tablaHistorialBody");
    tbody.html('<tr><td colspan="4" class="text-center text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Cargando pagos...</td></tr>');
    
    modalHistorial.show();

    // Fetch al endpoint específico que creamos
    fetch(`${API_PAGOS}/consulta/${consultaId}`)
        .then(res => {
            if(res.status === 204) return []; // Sin contenido
            if(!res.ok) throw new Error("Error fetch");
            return res.json();
        })
        .then(pagos => {
            tbody.empty();
            let totalPagado = 0;

            if (pagos.length === 0) {
                tbody.html('<tr><td colspan="4" class="text-center text-muted">No hay pagos registrados.</td></tr>');
            } else {
                pagos.forEach(p => {
                    totalPagado += p.monto;
                    const fecha = new Date(p.fechaPago).toLocaleDateString() + ' ' + new Date(p.fechaPago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    tbody.append(`
                        <tr>
                            <td>${fecha}</td>
                            <td>${p.metodoPago}</td>
                            <td class="small text-muted">${p.notas || '-'}</td>
                            <td class="text-end fw-bold text-dark">${formatter.format(p.monto)}</td>
                        </tr>
                    `);
                });
            }

            // Actualizar Footer del Modal
            $("#historial_sumaAbonos").text(formatter.format(totalPagado));
            
            const restante = totalVenta - totalPagado;
            // Ajuste visual para evitar "-0.00"
            const restanteVisual = restante < 0.1 ? 0 : restante;
            
            $("#historial_restante").text(formatter.format(restanteVisual));
            
            if(restanteVisual <= 0) {
                $("#historial_restante").removeClass("text-danger").addClass("text-success").text("LIQUIDADO");
            } else {
                $("#historial_restante").removeClass("text-success").addClass("text-danger");
            }
        })
        .catch(err => {
            console.error(err);
            tbody.html('<tr><td colspan="4" class="text-center text-danger">Error al cargar historial</td></tr>');
        });
}

// ==========================================
// 8. LÓGICA DEL DASHBOARD (GRÁFICAS Y KPIS)
// ==========================================

function cargarDashboard() {
  fetch("/api/dashboard/kpis")
    .then((res) => res.json())
    .then((data) => {
      // --- 1. LLENAR LAS TARJETAS (KPIs) ---
      const formatoMoneda = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      });

      // Validamos que los elementos existan antes de intentar inyectarles texto
      if (document.getElementById("kpiIngresos")) {
          document.getElementById("kpiIngresos").textContent = formatoMoneda.format(data.ingresosMes);
      }
      if (document.getElementById("kpiDeudas")) {
          document.getElementById("kpiDeudas").textContent = formatoMoneda.format(data.cuentasPorCobrar);
      }
      if (document.getElementById("kpiPacientes")) {
          document.getElementById("kpiPacientes").textContent = data.pacientesAtendidos;
      }
      if (document.getElementById("kpiPendientes")) {
          document.getElementById("kpiPendientes").textContent = data.trabajosPendientes;
      }

      // --- 2. DIBUJAR GRÁFICA DE BARRAS (Últimos 7 días) ---
      const ctxIngresos = document
        .getElementById("graficaIngresos")
        .getContext("2d");
      new Chart(ctxIngresos, {
        type: "bar",
        data: {
          labels: data.labelsDias, // Días de la semana desde Java
          datasets: [
            {
              label: "Ingresos Diarios ($)",
              data: data.datosDias, // Sumas diarias desde Java
              backgroundColor: "rgba(13, 110, 253, 0.7)", // Azul Bootstrap
              borderColor: "rgba(13, 110, 253, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } },
      });

      // --- 3. DIBUJAR GRÁFICA DE DONA (Ventas por Categoría) ---
      const ctxCat = document
        .getElementById("graficaCategorias")
        .getContext("2d");
      new Chart(ctxCat, {
        type: "doughnut",
        data: {
          labels: data.labelsCat.length > 0 ? data.labelsCat : ["Sin Ventas"], // Categorías desde Java
          datasets: [
            {
              data: data.datosCat.length > 0 ? data.datosCat : [1], // Montos desde Java
              // Paleta de colores atractiva
              backgroundColor: [
                "#198754",
                "#0dcaf0",
                "#ffc107",
                "#dc3545",
                "#6f42c1",
                "#fd7e14",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      });

      // --- 4. LLENAR TABLA DE TOP DEUDORES ---
      const tbodyDeudores = document.getElementById("tablaDeudoresBody");
      if (!tbodyDeudores) return; // Evita errores si no encuentra la tabla

      tbodyDeudores.innerHTML = "";

      if (data.topDeudores && data.topDeudores.length > 0) {
        data.topDeudores.forEach((d) => {
          // 1. LÓGICA DE WHATSAPP
          const telString = String(d.telefono || "");
          const telLimpio = telString.replace(/\D/g, "");

          const msjWa = encodeURIComponent(
            `Hola ${d.paciente}, le escribimos de Óptica DXY. Le recordamos que tiene un saldo pendiente de ${formatoMoneda.format(d.restante)}. ¡Lo esperamos!`,
          );

          const btnWa = telLimpio
            ? `<a href="https://wa.me/52${telLimpio}?text=${msjWa}" target="_blank" class="btn btn-sm btn-success shadow-sm" title="Avisar por WhatsApp">
                             <i class="fab fa-whatsapp"></i>
                           </a>`
            : "";

          // 2. LÓGICA DE CORREO ELECTRÓNICO
          const btnEmail = d.email 
            ? `<button type="button" onclick="enviarRecordatorioDashboard('${d.email}', '${d.paciente}', '${d.restante}')" class="btn btn-sm btn-primary shadow-sm ms-1" title="Enviar Recordatorio por Correo">
                 <i class="fas fa-envelope"></i>
               </button>` 
            : '';

          const sinContacto =
            !telLimpio && !d.email
              ? '<span class="badge bg-secondary">Sin contacto</span>'
              : "";

          // 3. DIBUJAR LA FILA
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td class="fw-bold ps-4">${d.paciente}</td>
                        
                        <td>${d.fecha ? d.fecha : "-"}</td>
                        
                        <td>
                            ${d.telefono ? '<i class="fas fa-phone-alt small text-muted me-2"></i>' + d.telefono : '<span class="text-muted small">N/A</span>'}
                        </td>

                        <td>
                            ${d.email ? '<i class="fas fa-envelope small text-muted me-2"></i>' + d.email : '<span class="text-muted small">N/A</span>'}
                        </td>
                        
                        <td class="text-danger fw-bold">${formatoMoneda.format(d.restante)}</td>
                        
                        <td class="text-center pe-4">
                            ${btnWa} 
                            ${btnEmail}
                            ${sinContacto}
                        </td>
                    `;
          tbodyDeudores.appendChild(tr);
        });
      } else {
        tbodyDeudores.innerHTML = `<tr><td colspan="6" class="text-center text-success py-4">¡No hay deudas pendientes!</td></tr>`;
      }
    })
    .catch((err) => console.error("Error cargando el Dashboard:", err));
}

// ==========================================
// 9. FUNCIÓN PARA ENVIAR CORREO DESDE DASHBOARD
// ==========================================
function enviarRecordatorioDashboard(email, paciente, deuda) {
    Swal.fire({
        title: '¿Enviar recordatorio?',
        text: `Se enviará un correo automático a ${paciente} (${email}) por su saldo de $${deuda}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: '<i class="fas fa-paper-plane me-1"></i> Sí, enviar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return fetch('/api/correos/recordatorio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo: email,
                    paciente: paciente,
                    restante: deuda
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Error al enviar el correo');
                return response.json();
            })
            .catch(error => {
                Swal.showValidationMessage(`Falló el envío: Verifica la configuración de tu correo SMTP.`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success', 
                title: 'Correo enviado correctamente', 
                showConfirmButton: false, timer: 3000
            });
        }
    });
}