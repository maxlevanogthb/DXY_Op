document.addEventListener("DOMContentLoaded", () => {
  cargarDashboard();
});

function cargarDashboard() {
  fetch("/api/dashboard/kpis")
    .then((res) => res.json())
    .then((data) => {
      // --- 1. LLENAR LAS TARJETAS (KPIs) ---
      const formatoMoneda = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      });

      document.getElementById("kpiIngresos").textContent = formatoMoneda.format(
        data.ingresosMes,
      );
      document.getElementById("kpiDeudas").textContent = formatoMoneda.format(
        data.cuentasPorCobrar,
      );
      document.getElementById("kpiPacientes").textContent =
        data.pacientesAtendidos;
      document.getElementById("kpiPendientes").textContent =
        data.trabajosPendientes;

      if (data.stockCritico > 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: `¡Atención! ${data.stockCritico} productos con stock crítico`,
          showConfirmButton: false,
          timer: 5000,
        });
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
          // 1. LÓGICA DE WHATSAPP (A prueba de balas convirtiendo a String)
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
          const asunto = encodeURIComponent(
            "Aviso de Saldo Pendiente - Óptica DXY",
          );
          const cuerpoCorreo = encodeURIComponent(
            `Hola ${d.paciente},\n\nLe escribimos de Óptica DXY para recordarle amablemente que su cuenta presenta un saldo pendiente de ${formatoMoneda.format(d.restante)}.\n\nQuedamos a su disposición.\n\nSaludos cordiales,\nEquipo Óptica DXY.`,
          );

          const btnEmail = d.email 
    ? `<button type="button" onclick="enviarRecordatorioDashboard('${d.email}', '${d.paciente}', '${d.restante}')" class="btn btn-sm btn-primary shadow-sm ms-1" title="Enviar Recordatorio por Correo">
         <i class="fas fa-envelope"></i>
       </button>` 
    : '';

          const sinContacto =
            !telLimpio && !d.email
              ? '<span class="badge bg-secondary">Sin contacto</span>'
              : "";

          // 3. DIBUJAR LA FILA (AHORA CON 6 COLUMNAS SEPARADAS)
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
        // Colspan 6 porque ahora tenemos 6 columnas
        tbodyDeudores.innerHTML = `<tr><td colspan="6" class="text-center text-success py-4">¡No hay deudas pendientes!</td></tr>`;
      }
    })
    .catch((err) => console.error("Error cargando el Dashboard:", err));
}

// ==========================================
// FUNCIÓN PARA ENVIAR CORREO DESDE DASHBOARD
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
