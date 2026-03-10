// ==========================================
// 1. CONSTANTES Y VARIABLES
// ==========================================
// Ahora tenemos dos rutas: una general para el CRUD y otra para la tabla
const API_PACIENTES = '/api/pacientes';
const API_PROSPECTOS = '/api/pacientes/prospectos';
const API_RAZONES = '/api/razones-visita';
let dataTable;

document.addEventListener('DOMContentLoaded', () => {
    inicializarTabla();
    cargarMotivosVisita();
});

// ==========================================
// 2. TABLA DE PROSPECTOS (DataTables)
// ==========================================
function inicializarTabla() {
    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().destroy();
    }

    dataTable = $('#tablaClientes').DataTable({
        // Usamos la ruta que creamos específicamente para traer solo a los "false"
        ajax: { url: API_PROSPECTOS, dataSrc: '' },
        dom: 'rtip', 
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
                data: 'graduacionActual',
                render: data => data ? `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">${data}</span>` : '<span class="text-muted small italic">N/A</span>'
            },
            { 
                data: 'motivo',
                render: data => `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">${data || 'General'}</span>`
            },
            { 
                data: 'fechaRegistro',
                render: data => {
                    if (!data) return '-';
                    // Blindaje por si Java lo manda diferente
                    let anio, mes, dia;
                    if (Array.isArray(data)) {
                        anio = data[0]; mes = data[1].toString().padStart(2, '0'); dia = data[2].toString().padStart(2, '0');
                    } else {
                        [anio, mes, dia] = data.split("T")[0].split("-");
                    }
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
        language: { url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json" },
        responsive: true,
        order: [[0, 'desc']]
    });

    $("#buscarCliente").on("keyup", function () {
        dataTable.search(this.value).draw();
    });
}

// ==========================================
// 3. LÓGICA DE PROSPECTOS (CRUD)
// ==========================================
function abrirModalNuevo() {
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalTitulo').innerText = 'Nuevo Cliente Potencial';
    
    // Asignamos la fecha de hoy
    document.getElementById('fecha').value = new Date().toISOString().split("T")[0];
    
    new bootstrap.Modal(document.getElementById('clienteModal')).show();
}

function editarCliente(id) {
    // Apuntamos al endpoint general de pacientes
    fetch(`${API_PACIENTES}/${id}`) 
        .then(response => response.json())
        .then(cliente => {
            document.getElementById('clienteId').value = cliente.id;
            document.getElementById('nombre').value = cliente.nombre;
            document.getElementById('telefono').value = cliente.telefono;
            document.getElementById('email').value = cliente.email;
            document.getElementById('motivo').value = cliente.motivo;
            document.getElementById('fecha').value = cliente.fechaRegistro; 
            // document.getElementById('mensaje').value = cliente.mensaje; // Descomentar si tienes este campo

            document.getElementById('modalTitulo').innerText = 'Editar Cliente Potencial';
            new bootstrap.Modal(document.getElementById('clienteModal')).show();
        })
        .catch(error => console.error('Error cargando cliente:', error));
}

function guardarCliente() {
    const id = document.getElementById('clienteId').value;
    const prospecto = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        motivo: document.getElementById('motivo').value,
        fechaRegistro: document.getElementById('fecha').value,
        // mensaje: document.getElementById('mensaje').value,
        // ⭐ ESTO ES CLAVE: Le decimos a Java que este es un prospecto
        esPacienteOficial: false 
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_PACIENTES}/${id}` : API_PACIENTES;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospecto)
    })
    .then(response => {
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
            dataTable.ajax.reload();
            Swal.fire({ icon: 'success', title: 'Guardado', text: 'El prospecto ha sido registrado.', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Error', 'No se pudo guardar el prospecto', 'error');
        }
    })
    .catch(error => console.error('Error:', error));
}

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
            fetch(`${API_PACIENTES}/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    dataTable.ajax.reload();
                    Swal.fire('Eliminado!', 'El registro ha sido eliminado.', 'success');
                }
            });
        }
    });
}

// ==========================================
// 4. LA MAGIA DE CONVERSIÓN (Refactorizado)
// ==========================================
function convertirPaciente(id) {
    Swal.fire({
        title: '¿Convertir a Paciente Oficial?',
        text: "Pasará a formar parte de tu base de datos clínica.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, convertir'
    }).then(result => {
        if (result.isConfirmed) {
            // ¡Mira qué limpio quedó! Una sola petición al nuevo endpoint.
            fetch(`${API_PACIENTES}/${id}/convertir`, { method: 'PATCH' })
            .then(res => {
                if (res.ok) {
                    // Al recargar la tabla, el paciente desaparecerá mágicamente de esta vista
                    dataTable.ajax.reload();
                    Swal.fire('¡PERFECTO!', 'Paciente convertido exitosamente.', 'success');
                } else {
                    throw new Error("Error en el servidor");
                }
            })
            .catch(err => Swal.fire('Error', 'No se pudo convertir al paciente.', 'error'));
        }
    });
}

function abrirWhatsApp(telefono) {
    if (!telefono) return;
    const numeroLimpio = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/52${numeroLimpio}`, '_blank');
}

function cargarMotivosVisita(nombreSeleccionar = null) {
    fetch(API_RAZONES)
        .then(res => res.json())
        .then(data => {
            const selectMotivo = document.getElementById('motivo');
            selectMotivo.innerHTML = '<option value="" disabled selected>Seleccione el motivo...</option>';

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

            // Auto-seleccionar el motivo recién creado
            if (nombreSeleccionar) {
                selectMotivo.value = nombreSeleccionar;
            }
        });
}

// ==========================================
// CREACIÓN IN-SITU (ACCESOS RÁPIDOS)
// ==========================================
function crearMotivoInSitu(modalId) {
    Swal.fire({
        title: 'Nuevo Motivo',
        html: `
            <div class="text-start mt-3">
                <div class="mb-3">
                    <label class="form-label fw-bold small">Nombre del Motivo *</label>
                    <input type="text" id="swal-nombre" class="form-control" placeholder="Ej. Ajuste de Armazón">
                </div>
                <div class="row">
                    <div class="col-8">
                        <label class="form-label fw-bold small">Categoría</label>
                        <select id="swal-categoria" class="form-select">
                            <option value="CITA">🛍️ Cita / Mostrador</option>
                            <option value="CONSULTA">🩺 Consulta Clínica</option>
                        </select>
                    </div>
                    <div class="col-4">
                        <label class="form-label fw-bold small">Color</label>
                        <input type="color" id="swal-color" class="form-control form-control-color w-100" value="#0d6efd" title="Elegir color">
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: '<i class="fas fa-save"></i> Guardar',
        cancelButtonText: 'Cancelar',
        target: document.getElementById(modalId), 
        
        preConfirm: () => {
            const nombre = document.getElementById('swal-nombre').value.trim();
            if (!nombre) { Swal.showValidationMessage('¡El nombre es obligatorio!'); return false; }
            return {
                nombre: nombre,
                categoria: document.getElementById('swal-categoria').value,
                colorHex: document.getElementById('swal-color').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/api/razones-visita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.value)
            })
            .then(res => res.json())
            .then(savedMotivo => {
                Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Motivo agregado', showConfirmButton: false, timer: 2000, target: document.getElementById(modalId)});
                
                // Recargamos la lista específica de este archivo
                cargarMotivosVisita(savedMotivo.nombre); 
            })
            .catch(err => Swal.fire({title: 'Error', text: 'No se pudo crear el motivo', icon: 'error', target: document.getElementById(modalId)}));
        }
    });
}