
const API_PACIENTES = "/api/pacientes";
let dataTable;
let modalHistorialInstancia; 


document.addEventListener("DOMContentLoaded", () => {
  const elHistorial = document.getElementById("modalHistorial");
  if (elHistorial) {
    modalHistorialInstancia = new bootstrap.Modal(elHistorial);
  } else {
    console.error(
      "❌ ERROR: No encuentro el modalHistorial en el HTML. Revisa admin-pacientes.html",
    );
  }

  inicializarTablaPacientes();
  cargarMotivosCategorizados();

  // Configurar búsqueda
  $("#buscarPaciente").on(
    "keyup",
    debounce(function () {
      dataTable.search(this.value).draw();
    }, 300),
  );
});

// ==========================================
// TABLA DE PACIENTES (DataTables)
// ==========================================
function inicializarTablaPacientes() {
  if ($.fn.DataTable.isDataTable("#tablaPacientes")) {
    $("#tablaPacientes").DataTable().destroy();
  }

  dataTable = $("#tablaPacientes").DataTable({
    ajax: { url: API_PACIENTES + "/oficiales", dataSrc: "" },
    
    columns: [
      { data: "id", className: "text-center text-secondary small" },
      {
        data: "nombre",
        className: "fw-bold text-dark",
        render: (data) =>
          `<i class="fas fa-user-circle me-2 text-secondary opacity-50"></i>${data}`,
      },
      {
        data: "telefono",
        render: (data) =>
          data
            ? `<span class="text-secondary"><i class="fas fa-phone me-1 small"></i>${data}</span>`
            : "-",
      },
      {
        data: "email",
        render: (data) =>
          data
            ? `<span class="text-secondary"><i class="fas fa-envelope me-1 small"></i>${data}</span>`
            : "-",
      },
      {
        data: "graduacionActual",
        render: (data) =>
          data
            ? `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">${data}</span>`
            : '<span class="text-muted small italic">N/A</span>',
      },
      {
        data: "motivo",
        render: (data) => {
          let color = "secondary";
          if (data && data.toLowerCase().includes("urgencia")) color = "danger";
          else if (data && data.toLowerCase().includes("lentes"))
            color = "success";
          else if (data && data.toLowerCase().includes("consulta"))
            color = "primary";
          return `<span class="badge bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-10">${data || "General"}</span>`;
        },
      },
      {
        data: "fechaRegistro",
        className: "align-middle",
        render: (data) => {
          if (!data) return '<span class="text-muted small">-</span>';
          const [anio, mes, dia] = data.split("-");
          return `<div class="d-flex align-items-center text-secondary">
                                <i class="far fa-calendar-alt me-2 text-primary opacity-50"></i>
                                <span class="fw-medium">${dia}/${mes}/${anio}</span>
                            </div>`;
        },
      },
      {
        data: null,
        className: "text-center",
        orderable: false,
        render: function (data, type, row) {
          const nombreSafe = row.nombre.replace(/'/g, "\\'");
          return `
            <div class="btn-group shadow-sm">
                <button type="button" class="btn btn-sm btn-success px-3" onclick="abrirModalConsulta(${row.id}, '${nombreSafe}')">
                    <i class="fas fa-plus me-1"></i> Consulta
                </button>
                
                <button type="button" class="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Más opciones</span>
                </button>
                
                <ul class="dropdown-menu shadow border-0 dropdown-menu-end">
                    <li>
                        <a class="dropdown-item text-primary" href="#" onclick="abrirHistorial(${row.id}, '${nombreSafe}')">
                            <i class="fas fa-history me-2"></i>Ver Historial
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item" href="#" onclick="editarPaciente(${row.id})">
                            <i class="fas fa-edit me-2 text-warning"></i>Editar
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="eliminarPaciente(${row.id})">
                            <i class="fas fa-trash-alt me-2"></i>Eliminar
                        </a>
                    </li>
                </ul>
            </div>
          `;
        },
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json",
    },
    responsive: true,
    autoWidth: false,
    order: [[0, "desc"]],
  });
}

// ==========================================
// LÓGICA DE PACIENTES 
// ==========================================

function abrirModalNuevo() {
  $("#formPaciente")[0].reset();
  $("#pacienteId").val("");
  $("#modalTitulo").html('<i class="fas fa-user-plus me-2"></i>Nuevo Paciente');

  const hoy = new Date().toISOString().split("T")[0];
  $("#fecha").val(hoy);
  $("#edad").val("");

  new bootstrap.Modal(document.getElementById("pacienteModal")).show();
}

function editarPaciente(id) {
  fetch(`${API_PACIENTES}/${id}`)
    .then((res) => res.json())
    .then((paciente) => {
      $("#pacienteId").val(paciente.id);
      $("#nombre").val(paciente.nombre);
      $("#edad").val(paciente.edad);
      $("#telefono").val(paciente.telefono);
      $("#email").val(paciente.email);
      $("#graduacion").val(paciente.graduacionActual);
      $("#motivo").val(paciente.motivo);
      $("#fecha").val(paciente.fechaRegistro);
      $("#mensaje").val(paciente.mensaje);

      $("#modalTitulo").html(
        '<i class="fas fa-user-edit me-2"></i>Editar Paciente',
      );
      new bootstrap.Modal(document.getElementById("pacienteModal")).show();
    })
    .catch((err) =>
      Swal.fire("Error", "No se pudieron cargar los datos", "error"),
    );
}

function guardarPaciente() {
  if (!$("#formPaciente")[0].checkValidity()) {
    $("#formPaciente")[0].reportValidity();
    return;
  }

  const id = $("#pacienteId").val();
  const paciente = {
    id: id ? parseInt(id) : null,
    nombre: $("#nombre").val(),
    edad: $("#edad").val(),
    telefono: $("#telefono").val(),
    email: $("#email").val(),
    graduacionActual: $("#graduacion").val(),
    motivo: $("#motivo").val(),
    fechaRegistro: $("#fecha").val(),
    mensaje: $("#mensaje").val(),
    esPacienteOficial: true
  };

  fetch(API_PACIENTES + (id ? `/${id}` : ""), {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paciente),
  })
    .then((res) => {
      if (res.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("pacienteModal"),
        ).hide();
        dataTable.ajax.reload(null, false);
        Swal.fire("Éxito", "Paciente guardado correctamente", "success");
      } else {
        res
          .text()
          .then((text) => Swal.fire("Error", "No se pudo guardar.", "error"));
      }
    })
    .catch((err) => Swal.fire("Error", "Error de red", "error"));
}

function eliminarPaciente(id) {
  Swal.fire({
    title: "¿Eliminar?",
    text: "No se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API_PACIENTES}/${id}`, { method: "DELETE" }).then((res) => {
        if (res.ok) {
          dataTable.ajax.reload(null, false);
          Swal.fire("Eliminado", "", "success");
        }
      });
    }
  });
}

// ==========================================
// UTILIDADES
// ==========================================

function cargarMotivosCategorizados(nombreSeleccionar = null) {
    fetch('/api/razones-visita')
        .then(res => res.json())
        .then(data => {
            const consultas = data.filter(r => !r.categoria || r.categoria.toUpperCase() === 'CONSULTA');
            const citas = data.filter(r => r.categoria && r.categoria.toUpperCase() === 'CITA');

            let opcionesHtml = '<option value="" disabled selected>Seleccione el motivo...</option>';

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

            // Inyectar en el Modal de Nuevo Paciente
            const selectMotivo = document.getElementById('motivo');
            if (selectMotivo) {
                selectMotivo.innerHTML = opcionesHtml;
                if(nombreSeleccionar) selectMotivo.value = nombreSeleccionar;
            }

            // Inyectar en el Modal de Hoja Clínica
            const selectRazonVisita = document.getElementById('razonVisita');
            if (selectRazonVisita) {
                selectRazonVisita.innerHTML = opcionesHtml;
                if(nombreSeleccionar) selectRazonVisita.value = nombreSeleccionar;
            }
        })
        .catch(err => console.error("Error cargando razones de visita:", err));
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
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
                            <option value="CONSULTA">🩺 Consulta Clínica</option>
                            <option value="CITA">🛍️ Cita / Mostrador</option>
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
        target: document.getElementById(modalId), // Se ancla al modal activo (Paciente o Prospecto)
        
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
                
                // Recargamos el select y lo auto-seleccionamos
                cargarMotivosCategorizados(savedMotivo.nombre); 
            })
            .catch(err => Swal.fire({title: 'Error', text: 'No se pudo crear el motivo', icon: 'error', target: document.getElementById(modalId)}));
        }
    });
}

// ==========================================
// ELIMINAR CONSULTA (HISTORIAL CLÍNICO)
// ==========================================
function eliminarConsultaDeHistorial(consultaId, pacienteId, nombrePaciente) {
    Swal.fire({
        title: '¿Eliminar Hoja Clínica?',
        html: `<p class="text-danger fw-bold mb-0">¡Esta acción es irreversible!</p><br>Se borrarán los datos médicos, la receta y los detalles de venta asociados a esta visita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> Sí, eliminar para siempre',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Bloqueamos el modal para que no den clic a otra cosa
            Swal.fire({title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
            
            fetch(`/api/consultas/${consultaId}`, {
                method: 'DELETE'
            })
            .then(async res => {
                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminado',
                        text: 'La consulta ha sido borrada del historial.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Recargar la tabla que está debajo (el historial del paciente)
                    abrirHistorial(pacienteId, nombrePaciente);
                    
                    if (typeof dataTable !== "undefined") dataTable.ajax.reload(null, false);
                    
                } else {
                    const errText = await res.text();
                    throw new Error(errText || 'Error al eliminar');
                }
            })
            .catch(err => {
                Swal.fire('Error', `No se pudo eliminar: ${err.message}`, 'error');
            });
        }
    });
}