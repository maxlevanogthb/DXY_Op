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
    // 1. Vamos al servidor por la configuración
    fetch('/api/configuracion')
        .then(res => res.json())
        .then(config => {
            configGlobal = config; // Guardamos los ajustes en memoria
            
            // 2. Inicializamos el calendario con los datos nuevos
            inicializarCalendario();
            
            // 3. Cargamos los motivos de visita
            cargarRazonesVisita();
        })
        .catch(err => {
            console.error("Error cargando configuración, usando respaldo", err);
            // Respaldo por si falla la base de datos
            configGlobal = { duracionCitaMinutos: 60, horaApertura: '08:00:00', horaCierre: '21:00:00' };
            inicializarCalendario();
            cargarRazonesVisita();
        });

    // 4. Lógica para sumar la duración dinámica (calcula hora fin)
    document.getElementById('citaHoraInicio').addEventListener('change', function() {
        const horaInicio = this.value; // Formato esperado "HH:mm" (ej. "13:30")
        if (horaInicio) {
            // Usamos Date de JS para sumar minutos exactos
            let fechaTemp = new Date(`2000-01-01T${horaInicio}:00`);
            
            // Le sumamos los minutos que el doc haya puesto en Configuración
            let duracion = configGlobal.duracionCitaMinutos || 60;
            fechaTemp.setMinutes(fechaTemp.getMinutes() + duracion);
            
            // Volvemos a formatear a 2 dígitos para HH:mm
            let horasFormateadas = fechaTemp.getHours().toString().padStart(2, '0');
            let minutosFormateados = fechaTemp.getMinutes().toString().padStart(2, '0');
            
            // Insertamos el resultado
            document.getElementById('citaHoraFin').value = `${horasFormateadas}:${minutosFormateados}`;
        }
    });
});

// ==========================================
// FUNCIÓN PARA DIBUJAR EL CALENDARIO
// ==========================================
function inicializarCalendario() {
    var calendarEl = document.getElementById('calendario');

    // Aseguramos que el formato sea "HH:mm:ss" para FullCalendar leyendo la configuración
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
        
        // --- AQUÍ ESTÁ LA CONEXIÓN MÁGICA CON TU CONFIGURACIÓN ---
        slotMinTime: apertura, 
        slotMaxTime: cierre, 
        
        expandRows: true,        
        contentHeight: 'auto',   
        allDaySlot: false, 
        events: '/api/citas', 

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
    document.getElementById('modalCitaTitulo').textContent = 'Agendar Nueva Cita';
    document.getElementById('seccionAccionesCita').classList.add('d-none');

    // Si le dio clic al calendario, pre-llenar la fecha y hora
    if (fechaClic) {
        const partes = fechaClic.split('T');
        document.getElementById('citaFecha').value = partes[0];
        
        if (partes[1]) {
            document.getElementById('citaHoraInicio').value = partes[1].substring(0, 5);
            
            // Calculamos la hora final con la configuración
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
    
    // Sacar los datos desde FullCalendar
    document.getElementById('citaId').value = evento.id;
    document.getElementById('citaNombre').value = evento.extendedProps.nombrePaciente || '';
    document.getElementById('citaTelefono').value = evento.extendedProps.telefono || '';
    document.getElementById('citaTipo').value = evento.extendedProps.tipo;
    document.getElementById('citaEstado').value = evento.extendedProps.estado;
    document.getElementById('citaNotas').value = evento.extendedProps.notas || '';

    // Manejo de fechas
    document.getElementById('citaFecha').value = evento.startStr.split('T')[0];
    document.getElementById('citaHoraInicio').value = evento.startStr.split('T')[1].substring(0, 5);
    if(evento.endStr) {
        document.getElementById('citaHoraFin').value = evento.endStr.split('T')[1].substring(0, 5);
    }

    // Mostrar botones de acción y configurar WhatsApp
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

    if (!fecha || !horaInicio || !horaFin) {
        Swal.fire('Error', 'Debes seleccionar fecha y horarios', 'error');
        return;
    }

    const payload = {
        nombreTemporal: document.getElementById('citaNombre').value,
        telefonoTemporal: document.getElementById('citaTelefono').value,
        inicio: `${fecha}T${horaInicio}:00`,
        fin: `${fecha}T${horaFin}:00`,
        tipo: document.getElementById('citaTipo').value,
        estado: document.getElementById('citaEstado').value,
        notas: document.getElementById('citaNotas').value
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
            calendario.refetchEvents();
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
// CATÁLOGO DINÁMICO DE MOTIVOS
// ==========================================
function cargarRazonesVisita() {
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
        })
        .catch(err => console.error("Error cargando razones de visita:", err));
}