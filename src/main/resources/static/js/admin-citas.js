// ==========================================
// VARIABLES GLOBALES
// ==========================================
let calendario;
const modalCita = new bootstrap.Modal(document.getElementById('citaModal'));
let configGlobal = {};

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/configuracion')
        .then(res => res.json())
        .then(config => {
            configGlobal = config;
            inicializarCalendario();
            cargarRazonesVisita();
        })
        .catch(err => {
            console.error("Error cargando configuración, usando respaldo", err);
            configGlobal = { duracionCitaMinutos: 60, horaApertura: '08:00:00', horaCierre: '21:00:00' };
            inicializarCalendario();
            cargarRazonesVisita();
        });

    // Lógica para sumar la duración dinámica
    document.getElementById('citaHoraInicio').addEventListener('change', function() {
        const horaInicio = this.value; 
        if (horaInicio) {
            let fechaTemp = new Date(`2000-01-01T${horaInicio}:00`);
            let duracion = configGlobal.duracionCitaMinutos || 60;
            fechaTemp.setMinutes(fechaTemp.getMinutes() + duracion);
            
            let horasFormateadas = fechaTemp.getHours().toString().padStart(2, '0');
            let minutosFormateados = fechaTemp.getMinutes().toString().padStart(2, '0');
            document.getElementById('citaHoraFin').value = `${horasFormateadas}:${minutosFormateados}`;
        }
    });

    // --- NUEVO: EVENTO DE AUTOCOMPLETADO DE PACIENTES ---
    inicializarBuscadorPacientes();
});

// ==========================================
// FUNCIÓN PARA DIBUJAR EL CALENDARIO
// ==========================================
function inicializarCalendario() {
    var calendarEl = document.getElementById('calendario');
    let apertura = configGlobal.horaApertura ? (configGlobal.horaApertura.substring(0,5) + ':00') : '08:00:00';
    let cierre = configGlobal.horaCierre ? (configGlobal.horaCierre.substring(0,5) + ':00') : '21:00:00';

    calendario = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek', 
        locale: 'es', 
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        slotMinTime: apertura, 
        slotMaxTime: cierre, 
        expandRows: true,        
        contentHeight: 'auto',   
        allDaySlot: false, 
        events: '/api/citas', 

        // Cuando el calendario termina de cargar los eventos, llenamos la tabla de abajo
        eventSourceSuccess: function(content, response) {
            actualizarTablaCitasDia(content);
            return content;
        },

        dateClick: function(info) {
            abrirModalNuevaCita(info.dateStr); 
        },
        eventClick: function(info) {
            abrirModalEditarCita(info.event);
        }
    });

    calendario.render();
}

// ==========================================
// FUNCIONES DE LOS MODALES DE CITAS
// ==========================================
function abrirModalNuevaCita(fechaClic = null) {
    document.getElementById('formCita').reset();
    document.getElementById('citaId').value = '';
    
    // --- NUEVO: Limpiamos el ID oculto porque es una cita nueva ---
    document.getElementById('citaPacienteId').value = '';
    document.getElementById('sugerenciasPacientes').style.display = 'none';

    document.getElementById('modalCitaTitulo').textContent = 'Agendar Nueva Cita';
    document.getElementById('seccionAccionesCita').classList.add('d-none');

    if (fechaClic) {
        const partes = fechaClic.split('T');
        document.getElementById('citaFecha').value = partes[0];
        if (partes[1]) {
            document.getElementById('citaHoraInicio').value = partes[1].substring(0, 5);
            let fin = new Date(fechaClic);
            let duracion = configGlobal.duracionCitaMinutos || 60;
            fin.setMinutes(fin.getMinutes() + duracion); 
            document.getElementById('citaHoraFin').value = fin.toTimeString().substring(0, 5);
        }
    }
    modalCita.show();
}

function abrirModalEditarCita(evento) {
    document.getElementById('modalCitaTitulo').textContent = 'Editar Cita';
    
    document.getElementById('citaId').value = evento.id;
    // --- NUEVO: Llenamos los datos reales del paciente ---
    document.getElementById('citaPacienteId').value = evento.extendedProps.pacienteId;
    document.getElementById('citaNombre').value = evento.extendedProps.nombrePaciente || '';
    document.getElementById('citaTelefono').value = evento.extendedProps.telefono || '';
    
    document.getElementById('citaTipo').value = evento.extendedProps.tipo;
    document.getElementById('citaEstado').value = evento.extendedProps.estado;
    document.getElementById('citaNotas').value = evento.extendedProps.notas || '';

    document.getElementById('citaFecha').value = evento.startStr.split('T')[0];
    document.getElementById('citaHoraInicio').value = evento.startStr.split('T')[1].substring(0, 5);
    if(evento.endStr) {
        document.getElementById('citaHoraFin').value = evento.endStr.split('T')[1].substring(0, 5);
    }

    document.getElementById('seccionAccionesCita').classList.remove('d-none');
    
    const btnWa = document.getElementById('btnWaCita');
    const telLimpio = evento.extendedProps.telefono ? evento.extendedProps.telefono.replace(/\D/g, '') : '';
    
    if (telLimpio) {
        btnWa.classList.remove('disabled');
        const fechaFormat = new Date(evento.start).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        const horaFormat = document.getElementById('citaHoraInicio').value;
        const msj = encodeURIComponent(`Hola ${evento.extendedProps.nombrePaciente}, le escribimos de Óptica DXY para confirmar su cita de *${evento.extendedProps.tipo}* el día *${fechaFormat}* a las *${horaFormat}*. ¿Nos confirma su asistencia?`);
        
        btnWa.onclick = () => window.open(`https://wa.me/52${telLimpio}?text=${msj}`, '_blank');
    } else {
        btnWa.classList.add('disabled');
        btnWa.onclick = null;
    }

    document.getElementById('btnEliminarCita').onclick = () => eliminarCita(evento.id);

    modalCita.show();
}

function guardarCita() {
    const fecha = document.getElementById('citaFecha').value;
    const horaInicio = document.getElementById('citaHoraInicio').value;
    const horaFin = document.getElementById('citaHoraFin').value;
    const pacienteId = document.getElementById('citaPacienteId').value;

    if (!fecha || !horaInicio || !horaFin) {
        Swal.fire('Error', 'Debes seleccionar fecha y horarios', 'error');
        return;
    }

    // --- NUEVO: EL PAYLOAD MÁGICO PARA EL BACKEND ---
    const payload = {
        inicio: `${fecha}T${horaInicio}:00`,
        fin: `${fecha}T${horaFin}:00`,
        tipo: document.getElementById('citaTipo').value,
        estado: document.getElementById('citaEstado').value,
        notas: document.getElementById('citaNotas').value,
        // Agrupamos al paciente como lo pide Java
        paciente: {
            id: pacienteId ? parseInt(pacienteId) : null,
            nombre: document.getElementById('citaNombre').value,
            telefono: document.getElementById('citaTelefono').value,
            motivo: document.getElementById('citaTipo').value
        }
    };

    const citaId = document.getElementById('citaId').value;
    const url = citaId ? `/api/citas/${citaId}` : '/api/citas';
    const metodo = citaId ? 'PUT' : 'POST';

    fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if(res.ok) {
            modalCita.hide();
            calendario.refetchEvents(); // Al recargar, también se actualizará la tabla
            Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Cita guardada', showConfirmButton: false, timer: 3000});
        } else {
            throw new Error("Error al guardar");
        }
    })
    .catch(err => Swal.fire('Error', 'Hubo un problema al guardar la cita', 'error'));
}

function eliminarCita(id) {
    Swal.fire({
        title: '¿Cancelar Cita?',
        text: "Se eliminará del calendario de forma permanente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/citas/${id}`, { method: 'DELETE' })
            .then(res => {
                if(res.ok) {
                    modalCita.hide();
                    calendario.refetchEvents();
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Cita eliminada', showConfirmButton: false, timer: 3000});
                }
            });
        }
    });
}

// ==========================================
// NUEVO: BUSCADOR DE PACIENTES
// ==========================================
function inicializarBuscadorPacientes() {
    let timerBusqueda;
    const inputNombre = document.getElementById('citaNombre');
    const inputTelefono = document.getElementById('citaTelefono');
    const inputId = document.getElementById('citaPacienteId');
    const divSugerencias = document.getElementById('sugerenciasPacientes');

    inputNombre.addEventListener('input', function(e) {
        clearTimeout(timerBusqueda);
        const texto = e.target.value.toLowerCase();

        // Si el usuario modifica el nombre, asumimos que es alguien nuevo o diferente
        inputId.value = '';

        if (texto.length < 2) {
            divSugerencias.style.display = 'none';
            return;
        }

        timerBusqueda = setTimeout(() => {
            // Buscamos en la base de datos
            fetch('/api/pacientes')
                .then(res => res.json())
                .then(pacientes => {
                    const filtrados = pacientes.filter(p => p.nombre.toLowerCase().includes(texto));
                    divSugerencias.innerHTML = '';
                    
                    if (filtrados.length > 0) {
                        filtrados.forEach(p => {
                            const a = document.createElement('a');
                            a.className = 'list-group-item list-group-item-action cursor-pointer';
                            a.innerHTML = `<strong>${p.nombre}</strong> <small class="text-muted ms-2">📞 ${p.telefono}</small>`;
                            
                            // Al hacer clic en la sugerencia
                            a.onclick = function() {
                                inputNombre.value = p.nombre;
                                inputTelefono.value = p.telefono;
                                inputId.value = p.id;
                                divSugerencias.style.display = 'none';
                            };
                            divSugerencias.appendChild(a);
                        });
                        divSugerencias.style.display = 'block';
                    } else {
                        divSugerencias.style.display = 'none';
                    }
                });
        }, 300); // Pequeño retraso para no saturar el servidor al teclear rápido
    });

    // Ocultar sugerencias si se hace clic fuera
    document.addEventListener('click', function(e) {
        if (e.target.id !== 'citaNombre') {
            divSugerencias.style.display = 'none';
        }
    });
}

// ==========================================
// NUEVO: TABLA DE PACIENTES DEL DÍA
// ==========================================
function actualizarTablaCitasDia(todosLosEventos) {
    const tbody = document.getElementById('bodyTablaCitasDia');
    tbody.innerHTML = '';

    // Filtramos solo las citas que son de HOY
    const fechaHoyLocal = new Date().toLocaleDateString('sv-SE'); // Formato YYYY-MM-DD local
    const citasHoy = todosLosEventos.filter(e => e.start.startsWith(fechaHoyLocal));

    // Ordenamos por hora de inicio
    citasHoy.sort((a, b) => new Date(a.start) - new Date(b.start));

    if (citasHoy.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="fas fa-mug-hot fa-2x mb-3 text-light"></i><br>No hay citas programadas para el día de hoy.</td></tr>`;
        return;
    }

    citasHoy.forEach(cita => {
        const props = cita.extendedProps;
        
        // Asignamos colores a los estados
        let badgeEstado = 'bg-secondary';
        if (props.estado === 'PENDIENTE') badgeEstado = 'bg-warning text-dark';
        if (props.estado === 'ATENDIDA') badgeEstado = 'bg-success';
        if (props.estado === 'CANCELADA' || props.estado === 'NO ASISTIÓ') badgeEstado = 'bg-danger';
        if (props.estado === 'CONFIRMADA') badgeEstado = 'bg-primary';

        // Formateamos la hora a HH:mm
        const horaInicio = cita.start.split('T')[1].substring(0, 5);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold text-primary"><i class="far fa-clock me-1"></i> ${horaInicio}</td>
            <td class="fw-bold">${props.nombrePaciente}</td>
            <td><a href="https://wa.me/52${props.telefono.replace(/\D/g, '')}" target="_blank" class="text-decoration-none text-success"><i class="fab fa-whatsapp"></i> ${props.telefono}</a></td>
            <td>${props.tipo}</td>
            <td><span class="badge ${badgeEstado} px-2 py-1">${props.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarCitaDesdeTabla('${cita.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                ${props.estado === 'ATENDIDA' && props.esPacienteOficial === false ? 
                  `<button class="btn btn-sm btn-success ms-1" onclick="convertirAPaciente(${props.pacienteId})" title="Convertir a Paciente"><i class="fas fa-user-check"></i></button>` 
                  : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editarCitaDesdeTabla(idString) {
    // Buscamos el evento en el calendario y abrimos su modal
    const evento = calendario.getEventById(idString);
    if(evento) abrirModalEditarCita(evento);
}

function convertirAPaciente(pacienteId) {
    Swal.fire({
        title: '¿Convertir a Paciente Oficial?',
        text: "Este prospecto pasará a formar parte de tu base de datos clínica principal.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Sí, convertir'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // Hacemos la petición PATCH a nuestro nuevo endpoint
            fetch(`/api/pacientes/${pacienteId}/convertir`, {
                method: 'PATCH'
            })
            .then(res => {
                if(res.ok) {
                    Swal.fire('¡Convertido!', 'El prospecto ahora es un paciente oficial.', 'success');
                    // Recargamos el calendario para que la tabla se actualice y el botón desaparezca
                    calendario.refetchEvents(); 
                } else {
                    throw new Error("Error en el servidor");
                }
            })
            .catch(err => Swal.fire('Error', 'No se pudo convertir al paciente.', 'error'));
            
        }
    });
}

// ==========================================
// CATÁLOGO DINÁMICO DE MOTIVOS
// ==========================================
function cargarRazonesVisita(motivoASeleccionar = null) {
    fetch('/api/razones-visita')
        .then(res => res.json())
        .then(data => {
            const selectTipo = document.getElementById('citaTipo');
            selectTipo.innerHTML = ''; 

            const consultas = data.filter(r => r.categoria === 'CONSULTA');
            const citas = data.filter(r => r.categoria === 'CITA');

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

            selectTipo.innerHTML = opcionesHtml;

            // ⭐ MAGIA UX: Si acabamos de crear un motivo, lo selecciona automáticamente
            if (motivoASeleccionar) {
                selectTipo.value = motivoASeleccionar;
            }
        })
        .catch(err => console.error("Error cargando razones de visita:", err));
}

// ==========================================
// CREACIÓN DE CATÁLOGO IN-SITU (VERSIÓN PRO)
// ==========================================
function crearMotivoInSitu() {
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
                        <input type="color" id="swal-color" class="form-control form-control-color w-100" value="#198754" title="Elegir color">
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        confirmButtonText: '<i class="fas fa-save"></i> Guardar',
        cancelButtonText: 'Cancelar',
        target: document.getElementById('citaModal'), // Evita conflicto con Bootstrap
        
        // Así leemos los datos de nuestro HTML personalizado
        preConfirm: () => {
            const nombre = document.getElementById('swal-nombre').value.trim();
            const categoria = document.getElementById('swal-categoria').value;
            const color = document.getElementById('swal-color').value;

            if (!nombre) {
                Swal.showValidationMessage('¡El nombre del motivo es obligatorio!');
                return false; // Detiene el cierre si está vacío
            }

            return {
                nombre: nombre,
                categoria: categoria,
                colorHex: color
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // result.value trae exactamente el objeto que armamos en preConfirm
            const nuevoMotivo = result.value;

            fetch('/api/razones-visita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoMotivo)
            })
            .then(res => {
                if(!res.ok) throw new Error("Error al guardar");
                return res.json();
            })
            .then(savedMotivo => {
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success', 
                    title: 'Motivo agregado al catálogo', showConfirmButton: false, timer: 2000,
                    target: document.getElementById('citaModal') // También lo anclamos por si acaso
                });
                
                // Recargamos el select y lo auto-seleccionamos
                cargarRazonesVisita(savedMotivo.nombre); 
            })
            .catch(err => Swal.fire({title: 'Error', text: 'No se pudo crear el motivo', icon: 'error', target: document.getElementById('citaModal')}));
        }
    });
}