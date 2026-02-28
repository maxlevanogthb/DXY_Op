let dataTable;
const API_URL = '/api/potenciales';
const API_RAZONES = '/api/razones-visita';

document.addEventListener('DOMContentLoaded', () => {
    inicializarTabla();
    cargarMotivosVisita();
});

// 1. Cargar e Inicializar DataTable con Fetch
function inicializarTabla() {
    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().destroy();
    }

    dataTable = $('#tablaClientes').DataTable({
        ajax: { url: API_URL, dataSrc: '' },
        dom: 'rtip', // IMPORTANTE: Oculta el buscador viejo de DataTables
        columns: [
            { data: 'id', className: "text-center text-secondary small" },
            { 
                data: 'nombre', 
                className: "fw-bold text-dark",
                render: data => `<i class="fas fa-user-circle me-2 text-secondary opacity-50"></i>${data}`
            },
            { 
                data: 'telefono',
                render: data => `<span><i class="fas fa-phone me-1 small opacity-50"></i>${data}</span>`
            },
            { data: 'email', render: data => data || '-' },
            { 
                data: 'motivo',
                render: data => `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">${data || 'General'}</span>`
            },
            { 
                data: 'estado',
                render: data => {
                    let color = data === 'ATENDIDO' ? 'success' : (data === 'PENDIENTE' ? 'warning' : 'secondary');
                    return `<span class="badge bg-${color}">${data}</span>`;
                }
            },
            { 
                data: 'fecha',
                render: data => {
                    if (!data) return '-';
                    const [anio, mes, dia] = data.split("-");
                    return `<div class="d-flex align-items-center text-secondary">
                                <i class="far fa-calendar-alt me-2 text-primary opacity-50"></i>
                                <span class="fw-medium">${dia}/${mes}/${anio}</span>
                            </div>`;
                }
            },
            {
                data: null,
                className: "text-center",
                render: function(data, type, row) {
                    return `
                        <div class="btn-group shadow-sm">
                            <button class="btn btn-sm btn-success px-3" onclick="convertirPaciente(${row.id})" title="Convertir a Paciente">
                                <i class="fas fa-user-check me-1"></i> Paciente
                            </button>
                            <button type="button" class="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false"></button>
                            <ul class="dropdown-menu shadow border-0 dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="editarCliente(${row.id})"><i class="fas fa-edit me-2 text-warning"></i>Editar</a></li>
                                <li><a class="dropdown-item" href="#" onclick="abrirWhatsApp('${row.telefono}')"><i class="fab fa-whatsapp me-2 text-success"></i>WhatsApp</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="eliminarCliente(${row.id})"><i class="fas fa-trash-alt me-2"></i>Eliminar</a></li>
                            </ul>
                        </div>`;
                }
            }
        ],
        language: { url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
        responsive: true,
        order: [[0, 'desc']]
    });

    // ACTIVAR EL BUSCADOR DE LA TARJETA
    $("#buscarCliente").on("keyup", function () {
        dataTable.search(this.value).draw();
    });
}

// 2. Abrir Modal para Nuevo Cliente
function abrirModalNuevo() {
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalTitulo').innerText = 'Nuevo Cliente Potencial';
    
    // Poner fecha de hoy por defecto
    document.getElementById('fecha').valueAsDate = new Date();
    
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
}

// 3. Abrir Modal para Editar (Fetch GET simple o usar datos de fila)
function editarCliente(id) {
    // Opción A: Fetch al servidor para obtener datos frescos
    fetch(`${API_URL}/${id}`) // GET /api/potenciales/{id}
        .then(response => response.json())
        .then(cliente => {
            document.getElementById('clienteId').value = cliente.id;
            document.getElementById('nombre').value = cliente.nombre;
            document.getElementById('telefono').value = cliente.telefono;
            document.getElementById('email').value = cliente.email;
            document.getElementById('motivo').value = cliente.motivo;
            document.getElementById('fecha').value = cliente.fecha ? cliente.fecha.split('T')[0] : ''; // Ajuste formato fecha
            document.getElementById('mensaje').value = cliente.mensaje;

            document.getElementById('modalTitulo').innerText = 'Editar Cliente';
            
            const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
            modal.show();
        })
        .catch(error => console.error('Error cargando cliente:', error));
}

// 4. Guardar (Crear o Actualizar)
function guardarCliente() {
    const id = document.getElementById('clienteId').value;
    const cliente = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        motivo: document.getElementById('motivo').value,
        fecha: document.getElementById('fecha').value,
        mensaje: document.getElementById('mensaje').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    })
    .then(response => {
        if (response.ok) {
            // Cerrar modal
            const modalEl = document.getElementById('clienteModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Recargar tabla
            dataTable.ajax.reload();
            
            // Alerta éxito
            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'El Cliente Potencial ha sido registrado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
        }
    })
    .catch(error => console.error('Error:', error));
}

// 5. Eliminar Cliente
function eliminarCliente(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    dataTable.ajax.reload();
                    Swal.fire('Eliminado!', 'El registro ha sido eliminado.', 'success');
                } else {
                    Swal.fire('Error', 'No se pudo eliminar', 'error');
                }
            });
        }
    });
}

// 6. Funcionalidad WhatsApp
function abrirWhatsApp(telefono) {
    if (!telefono) return;
    // Limpiar número (quitar guiones, espacios, paréntesis)
    const numeroLimpio = telefono.replace(/\D/g, '');
    const url = `https://wa.me/52${numeroLimpio}`;
    window.open(url, '_blank');
}

// Función completa corregida
function convertirPaciente(id) {
    Swal.fire({
        title: '¿Convertir a Paciente?',
        icon: 'question',
        showCancelButton: true
    }).then(result => {
        if (result.isConfirmed) {
            // 1. CAMBIAR ESTADO
            fetch(`/api/potenciales/${id}/estado/ATENDIDO`, { method: 'PUT' })
            .then(res => {
                if (!res.ok) throw new Error('Error estado');
                // 2. OBTENER DATOS (ahora funciona)
                return fetch(`/api/potenciales/${id}`);
            })
            .then(res => {
                if (!res.ok) throw new Error('Error datos');
                return res.json();
            })
            .then(potencial => {
                console.log('✅ DATOS:', potencial);
                
                // 3. CREAR PACIENTE
                const pacienteData = {
                    nombre: potencial.nombre,
                    telefono: potencial.telefono,
                    email: potencial.email,
                    graduacionActual: "De landing - pendiente actualizar",
                    motivo: potencial.motivo,
                    fecha: potencial.fecha || new Date().toISOString().split('T')[0]
                };
                
                console.log('📤 POST:', JSON.stringify(pacienteData));
                
                return fetch('/api/clientes', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(pacienteData)
                });
            })
            .then(res => {
                console.log('✅ RESPUESTA POST:', res.status);
                if (!res.ok) throw new Error(`Error ${res.status}`);
                dataTable.ajax.reload();
                Swal.fire('¡PERFECTO!', 'Paciente creado ✅', 'success');
            })
            .catch(err => {
                console.error('❌ ERROR:', err);
                Swal.fire('Error', err.message, 'error');
            });
        }
    });
}

// ==========================================
// CARGAR CATÁLOGO DINÁMICO DE MOTIVOS
// ==========================================
function cargarMotivosVisita() {
    fetch(API_RAZONES)
        .then(res => res.json())
        .then(data => {
            const selectMotivo = document.getElementById('motivo');
            selectMotivo.innerHTML = '<option value="" disabled selected>Seleccione el motivo...</option>';

            // Filtramos usando la misma lógica robusta
            const consultas = data.filter(r => !r.categoria || r.categoria.toUpperCase() === 'CONSULTA');
            const citas = data.filter(r => r.categoria && r.categoria.toUpperCase() === 'CITA');

            let opcionesHtml = '';

            if (consultas.length > 0) {
                opcionesHtml += '<optgroup label="🩺 Consultas Clínicas">';
                consultas.forEach(c => opcionesHtml += `<option value="${c.nombre}">${c.nombre}</option>`);
                opcionesHtml += '</optgroup>';
            }

            if (citas.length > 0) {
                opcionesHtml += '<optgroup label="🛍️ Citas y Mostrador">';
                citas.forEach(c => opcionesHtml += `<option value="${c.nombre}">${c.nombre}</option>`);
                opcionesHtml += '</optgroup>';
            }

            selectMotivo.innerHTML += opcionesHtml;
        })
        .catch(err => console.error("Error cargando razones de visita:", err));
}



