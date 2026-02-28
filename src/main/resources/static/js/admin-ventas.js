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