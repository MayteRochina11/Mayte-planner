// ============ DATOS GLOBALES ============
let tareas = [];
let notas = [];
let sesionPomodoro = null;
let temporizadorInterval = null;
let bloqueActual = 0;
let tiempoRestante = 0;

// Frases de Mayte
const FRASES_MAYTE = [
    "🌸 Lo hiciste muy bien, te amo",
    "✨ Eres increíble, sigue avanzando",
    "💖 ¡Tú puedes con esto, mi amor!",
    "🌟 Qué orgullo siento de ti",
    "💪 Un pasito más, vas genial",
    "😘 Te quiero mucho, no te rindas",
    "🎯 ¡Eso es disciplina! Sigue así",
    "📚 Cada día aprendes más, te admiro"
];

// ============ FUNCIONES DE FECHAS CORREGIDAS ============
// Obtener fecha actual en formato YYYY-MM-DD (sin zona horaria)
function getFechaActualLocal() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// Comparar si dos fechas son iguales (solo año/mes/día)
function esMismaFecha(fecha1Str, fecha2Str) {
    if (!fecha1Str || !fecha2Str) return false;
    // Ambas ya están en formato YYYY-MM-DD
    return fecha1Str === fecha2Str;
}

// Formatear fecha para mostrar
function formatearFechaMostrar(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    mostrarFraseMayte();
    configurarNavegacion();
    renderizarCalendario();
    renderizarTareasDelDia();  // ← Importante: mostrar tareas al cargar
    renderizarNotas();
    cargarFeynmanGuardado();
    
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    
    // Configurar cambio de vista
    document.querySelectorAll('.vista-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.vista-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarCalendario();
        });
    });
    
    console.log('App iniciada - Fecha actual:', getFechaActualLocal());
    console.log('Tareas cargadas:', tareas);
});

// ============ MAYTE ============
function mostrarFraseMayte() {
    const fraseAleatoria = FRASES_MAYTE[Math.floor(Math.random() * FRASES_MAYTE.length)];
    const mayteMsg = document.getElementById('mayteMessage');
    if (mayteMsg) mayteMsg.textContent = fraseAleatoria;
}

function mostrarNotificacionMayte(mensaje) {
    // Mostrar en la UI
    const mayteMsg = document.getElementById('mayteMessage');
    if (mayteMsg) {
        const original = mayteMsg.textContent;
        mayteMsg.textContent = mensaje;
        setTimeout(() => {
            mayteMsg.textContent = original;
        }, 5000);
    }
    
    // Notificación push si está permitida
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🌸 Mayte', { body: mensaje });
    }
    
    // Vibración
    if ('vibrate' in navigator) {
        navigator.vibrate(200);
    }
}

// ============ LOCALSTORAGE ============
function guardarDatos() {
    localStorage.setItem('mayte_tareas', JSON.stringify(tareas));
    localStorage.setItem('mayte_notas', JSON.stringify(notas));
    const feynmanText = document.getElementById('feynmanTexto');
    if (feynmanText) localStorage.setItem('mayte_feynman', feynmanText.value);
    console.log('Datos guardados - Tareas:', tareas.length);
}

function cargarDatos() {
    const tareasGuardadas = localStorage.getItem('mayte_tareas');
    if (tareasGuardadas) {
        tareas = JSON.parse(tareasGuardadas);
        console.log('Tareas cargadas:', tareas);
    }
    
    const notasGuardadas = localStorage.getItem('mayte_notas');
    if (notasGuardadas) notas = JSON.parse(notasGuardadas);
}

function cargarFeynmanGuardado() {
    const feynman = localStorage.getItem('mayte_feynman');
    const feynmanText = document.getElementById('feynmanTexto');
    if (feynman && feynmanText) feynmanText.value = feynman;
}

function guardarFeynman() {
    guardarDatos();
    mostrarNotificacionMayte("🧠 ¡Excelente explicación! Así se aprende de verdad, mi amor 💖");
}

// ============ NAVEGACIÓN ============
function configurarNavegacion() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Actualizar contenido al cambiar de pestaña
            if (tabId === 'calendario') {
                renderizarTareasDelDia();
            }
        });
    });
}

// ============ CALENDARIO ============
function renderizarCalendario() {
    const container = document.getElementById('calendario-container');
    if (!container) return;
    
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    const fechaActualStr = getFechaActualLocal();
    
    let html = '<div class="calendario-grid">';
    html += '<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8px;">';
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(d => html += `<div style="padding: 8px; font-weight: bold;">${d}</div>`);
    html += '</div><div style="display: grid; grid-template-columns: repeat(7, 1fr);">';
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diaInicio = primerDia.getDay();
    
    // Días vacíos antes del primer día
    for (let i = 0; i < diaInicio; i++) html += '<div style="padding: 10px;"></div>';
    
    // Días del mes
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
        const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const esHoy = fechaStr === fechaActualStr;
        const tieneTarea = tareas.some(t => t.fecha === fechaStr);
        
        html += `<div style="padding: 10px; text-align: center; ${esHoy ? 'background: #FF6B9D; color: white; border-radius: 50%;' : ''} ${tieneTarea ? 'font-weight: bold;' : ''}">
                    ${i}${tieneTarea ? '📌' : ''}
                </div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
}

function renderizarTareasDelDia() {
    const container = document.getElementById('listaTareas');
    if (!container) return;
    
    const fechaActual = getFechaActualLocal();
    console.log('Buscando tareas para fecha:', fechaActual);
    
    // Filtrar tareas que tengan EXACTAMENTE la fecha actual
    const tareasHoy = tareas.filter(t => {
        if (!t.fecha) return false;
        return t.fecha === fechaActual;
    });
    
    console.log('Tareas encontradas para hoy:', tareasHoy);
    
    if (tareasHoy.length === 0) {
        container.innerHTML = '<div class="tarea-vacia">✨ No hay tareas para hoy. ¡Disfruta tu día! ✨</div>';
        return;
    }
    
    // Ordenar por hora
    tareasHoy.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
    
    container.innerHTML = tareasHoy.map(t => `
        <div class="tarea-item ${t.completada ? 'tarea-completada' : ''}">
            <div style="flex: 1;">
                <div class="tarea-titulo">${escapeHtml(t.titulo)}</div>
                <div class="tarea-fecha">${t.hora || 'Todo el día'} • ${formatearFechaMostrar(t.fecha)}</div>
            </div>
            <div>
                <button onclick="completarTarea(${t.id})" style="background: #4caf50; color: white; border: none; border-radius: 20px; padding: 5px 12px; margin-right: 8px; cursor: pointer;">✓</button>
                <button onclick="eliminarTarea(${t.id})" style="background: #f44336; color: white; border: none; border-radius: 20px; padding: 5px 12px; cursor: pointer;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function completarTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (tarea) {
        tarea.completada = !tarea.completada;
        guardarDatos();
        renderizarTareasDelDia();
        if (tarea.completada) {
            mostrarNotificacionMayte(`🎉 ¡Completaste "${tarea.titulo}"! Eres increíble, te amo 💖`);
        }
    }
}

function abrirModalTarea() {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    // Obtener fecha actual en formato YYYY-MM-DD
    const fechaHoy = getFechaActualLocal();
    
    modalBody.innerHTML = `
        <h3>📅 Nueva Tarea</h3>
        <input type="text" id="tareaTitulo" placeholder="Título de la tarea" class="input-full" autofocus>
        <label style="margin-top: 10px; display: block;">📆 Fecha:</label>
        <input type="date" id="tareaFecha" class="input-full" value="${fechaHoy}">
        <label style="margin-top: 10px; display: block;">⏰ Hora (opcional):</label>
        <input type="time" id="tareaHora" class="input-full">
        <div class="button-group">
            <button onclick="crearTarea()" class="btn-primary">💾 Guardar</button>
            <button onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
        </div>
    `;
    document.getElementById('modal').style.display = 'flex';
}

function crearTarea() {
    const titulo = document.getElementById('tareaTitulo')?.value;
    const fecha = document.getElementById('tareaFecha')?.value;
    const hora = document.getElementById('tareaHora')?.value || '';
    
    if (!titulo) {
        mostrarNotificacionMayte("Amor, ponle un título a tu tarea 💖");
        return;
    }
    
    if (!fecha) {
        mostrarNotificacionMayte("Selecciona una fecha para la tarea 📅");
        return;
    }
    
    const nuevaTarea = {
        id: Date.now(),
        titulo: titulo,
        fecha: fecha,  // Guardamos directamente YYYY-MM-DD
        hora: hora,
        completada: false,
        creada: new Date().toISOString()
    };
    
    tareas.push(nuevaTarea);
    guardarDatos();
    cerrarModal();
    renderizarTareasDelDia();
    renderizarCalendario();
    mostrarNotificacionMayte(`✨ Tarea "${titulo}" guardada para ${formatearFechaMostrar(fecha)}. ¡Tú puedes! 💖`);
}

function eliminarTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (confirm(`¿Eliminar "${tarea?.titulo}"?`)) {
        tareas = tareas.filter(t => t.id !== id);
        guardarDatos();
        renderizarTareasDelDia();
        renderizarCalendario();
        mostrarNotificacionMayte("Tarea eliminada. ¡Sigue adelante! 🌟");
    }
}

// ============ NOTAS CON PRIORIDAD ============
function renderizarNotas() {
    const container = document.getElementById('listaNotasContainer');
    if (!container) return;
    
    const prioridadTexto = { rojo: '🔴 Súper Importante', amarillo: '🟡 Importante', verde: '🟢 Normal' };
    
    if (notas.length === 0) {
        container.innerHTML = '<div class="tarea-vacia">📝 No hay notas. ¡Crea una!</div>';
        return;
    }
    
    container.innerHTML = notas.map(n => `
        <div class="nota-item prioridad-${n.prioridad}">
            <div style="flex:1">
                <strong>${escapeHtml(n.titulo)}</strong>
                <div style="font-size:11px; color:#666; margin-top: 4px;">${prioridadTexto[n.prioridad]}</div>
                <p style="margin-top:8px; font-size:14px;">${escapeHtml(n.contenido || '')}</p>
            </div>
            <button onclick="eliminarNota(${n.id})" style="background: none; border: none; font-size: 20px; cursor: pointer;">🗑️</button>
        </div>
    `).join('');
}

function abrirModalNota() {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <h3>📝 Nueva Nota</h3>
        <input type="text" id="notaTitulo" placeholder="Título" class="input-full" autofocus>
        <textarea id="notaContenido" placeholder="Contenido" rows="3" class="input-full"></textarea>
        <select id="notaPrioridad" class="input-full">
            <option value="rojo">🔴 Súper Importante</option>
            <option value="amarillo">🟡 Importante</option>
            <option value="verde">🟢 Normal</option>
        </select>
        <div class="button-group">
            <button onclick="crearNota()" class="btn-primary">💾 Guardar</button>
            <button onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
        </div>
    `;
    document.getElementById('modal').style.display = 'flex';
}

function crearNota() {
    const titulo = document.getElementById('notaTitulo')?.value;
    const contenido = document.getElementById('notaContenido')?.value;
    const prioridad = document.getElementById('notaPrioridad')?.value;
    
    if (!titulo) {
        mostrarNotificacionMayte("Ponle un título a tu nota, mi amor 📝");
        return;
    }
    
    const nuevaNota = {
        id: Date.now(),
        titulo: titulo,
        contenido: contenido || '',
        prioridad: prioridad || 'verde'
    };
    
    notas.push(nuevaNota);
    guardarDatos();
    renderizarNotas();
    cerrarModal();
    mostrarNotificacionMayte("📝 Nota guardada. ¡Muy organizado!");
}

function eliminarNota(id) {
    notas = notas.filter(n => n.id !== id);
    guardarDatos();
    renderizarNotas();
}

// ============ POMODORO AVANZADO ============
function agregarBloque() {
    const container = document.getElementById('listaBloquesContainer');
    if (!container) return;
    
    const bloqueDiv = document.createElement('div');
    bloqueDiv.className = 'bloque-item';
    bloqueDiv.innerHTML = `
        <select class="tipo-bloque">
            <option value="estudio">📚 Estudio</option>
            <option value="descanso">☕ Descanso</option>
        </select>
        <input type="number" placeholder="Duración (min)" class="duracion-bloque" min="1" value="25">
        <input type="text" placeholder="${Math.random() > 0.5 ? 'Materia / Tema' : 'Acción del descanso'}" class="titulo-bloque">
        <button onclick="this.parentElement.remove()" style="background: #ff4444; color:white; border:none; border-radius:8px; padding:5px 10px; cursor:pointer;">❌</button>
    `;
    container.appendChild(bloqueDiv);
}

function iniciarSesionPomodoro() {
    const nombre = document.getElementById('sesionNombre')?.value;
    const tiempoTotalInput = document.getElementById('tiempoTotal')?.value;
    const tiempoTotal = tiempoTotalInput ? parseInt(tiempoTotalInput) : null;
    
    if (!nombre) {
        mostrarNotificacionMayte("Amor, ponle un nombre a tu sesión 💖");
        return;
    }
    
    const bloques = [];
    document.querySelectorAll('#listaBloquesContainer .bloque-item').forEach(item => {
        const duracion = parseInt(item.querySelector('.duracion-bloque')?.value || 0);
        if (duracion > 0) {
            bloques.push({
                tipo: item.querySelector('.tipo-bloque')?.value || 'estudio',
                duracion: duracion,
                titulo: item.querySelector('.titulo-bloque')?.value || (duracion > 0 ? 'Actividad' : '')
            });
        }
    });
    
    if (bloques.length === 0) {
        mostrarNotificacionMayte("Crea al menos un bloque de estudio, mi amor 📚");
        return;
    }
    
    const sumaDuracion = bloques.reduce((sum, b) => sum + b.duracion, 0);
    if (tiempoTotal && sumaDuracion !== tiempoTotal) {
        mostrarNotificacionMayte(`⚠️ La suma de bloques (${sumaDuracion} min) no coincide con ${tiempoTotal} min. ¡Ajústalo!`);
        return;
    }
    
    sesionPomodoro = { nombre, tiempoTotal: sumaDuracion, bloques };
    bloqueActual = 0;
    
    const configPanel = document.getElementById('configPanel');
    const timerPanel = document.getElementById('timerPanel');
    if (configPanel) configPanel.style.display = 'none';
    if (timerPanel) timerPanel.style.display = 'block';
    
    iniciarBloque();
}

function iniciarBloque() {
    if (bloqueActual >= sesionPomodoro.bloques.length) {
        completarSesion();
        return;
    }
    
    const bloque = sesionPomodoro.bloques[bloqueActual];
    const esEstudio = bloque.tipo === 'estudio';
    
    const timerTipo = document.getElementById('timerTipo');
    const timerTitulo = document.getElementById('timerTitulo');
    const siguienteTexto = document.getElementById('siguienteTexto');
    
    if (timerTipo) {
        timerTipo.innerHTML = esEstudio ? '📚 ESTUDIO' : '☕ DESCANSO';
        timerTipo.style.color = esEstudio ? '#4caf50' : '#ff9800';
    }
    if (timerTitulo) timerTitulo.textContent = bloque.titulo || (esEstudio ? '¡A estudiar!' : '¡A descansar!');
    
    const siguiente = sesionPomodoro.bloques[bloqueActual + 1];
    if (siguienteTexto) {
        if (siguiente) {
            siguienteTexto.textContent = `${siguiente.tipo === 'estudio' ? '📚' : '☕'} ${siguiente.titulo || 'Siguiente actividad'} (${siguiente.duracion} min)`;
        } else {
            siguienteTexto.textContent = '🎉 ¡Último bloque! ¡Tú puedes!';
        }
    }
    
    tiempoRestante = bloque.duracion * 60;
    actualizarDisplay();
    
    if (temporizadorInterval) clearInterval(temporizadorInterval);
    temporizadorInterval = setInterval(() => {
        if (tiempoRestante > 0) {
            tiempoRestante--;
            actualizarDisplay();
            
            const progreso = ((bloque.duracion * 60 - tiempoRestante) / (bloque.duracion * 60)) * 100;
            const progresoBloque = document.getElementById('progresoBloque');
            if (progresoBloque) progresoBloque.style.width = `${progreso}%`;
        } else {
            clearInterval(temporizadorInterval);
            finalizarBloque();
        }
    }, 1000);
}

function actualizarDisplay() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = `${minutos.toString().padStart(2,'0')}:${segundos.toString().padStart(2,'0')}`;
    }
}

function finalizarBloque() {
    const bloque = sesionPomodoro.bloques[bloqueActual];
    const esEstudio = bloque.tipo === 'estudio';
    
    // Vibrar
    if ('vibrate' in navigator) {
        navigator.vibrate(esEstudio ? [500, 200, 500] : [300, 100, 300, 100, 600]);
    }
    
    // Mensaje contextual de Mayte
    if (esEstudio) {
        const siguiente = sesionPomodoro.bloques[bloqueActual + 1];
        if (siguiente) {
            mostrarNotificacionMayte(`✨ ¡Excelente! Terminaste "${bloque.titulo}". Ahora a descansar: ${siguiente.titulo} 💖`);
        } else {
            mostrarNotificacionMayte(`🎉 ¡FELICIDADES! Completaste "${bloque.titulo}". ¡Eres increíble, te amo! 🌟`);
        }
    } else {
        const siguiente = sesionPomodoro.bloques[bloqueActual + 1];
        if (siguiente) {
            mostrarNotificacionMayte(`🌸 Descanso completado. ¿Listo para "${siguiente.titulo}"? ¡Vamos, mi amor! 💪`);
        }
    }
    
    bloqueActual++;
    iniciarBloque();
}

function completarSesion() {
    clearInterval(temporizadorInterval);
    mostrarNotificacionMayte("🎉 ¡SESIÓN COMPLETADA! Lo hiciste increíble, estoy muy orgullosa de ti ❤️");
    
    const timerPanel = document.getElementById('timerPanel');
    const configPanel = document.getElementById('configPanel');
    if (timerPanel) timerPanel.style.display = 'none';
    if (configPanel) configPanel.style.display = 'block';
    
    // Limpiar formulario
    const sesionNombre = document.getElementById('sesionNombre');
    const tiempoTotal = document.getElementById('tiempoTotal');
    const listaBloques = document.getElementById('listaBloquesContainer');
    if (sesionNombre) sesionNombre.value = '';
    if (tiempoTotal) tiempoTotal.value = '';
    if (listaBloques) listaBloques.innerHTML = '';
}

function cancelarSesion() {
    if (confirm('¿Cancelar la sesión? Has avanzado mucho, pero puedes retomar después')) {
        clearInterval(temporizadorInterval);
        const timerPanel = document.getElementById('timerPanel');
        const configPanel = document.getElementById('configPanel');
        if (timerPanel) timerPanel.style.display = 'none';
        if (configPanel) configPanel.style.display = 'block';
        mostrarNotificacionMayte("Está bien, descansa un poco. ¡Siempre puedes retomar cuando quieras! 💖");
    }
}

// ============ AYUDA (MANUAL POR SECCIÓN) ============
function mostrarAyuda(seccion) {
    const modalAyuda = document.getElementById('modalAyuda');
    const modalAyudaBody = document.getElementById('modalAyudaBody');
    if (!modalAyuda || !modalAyudaBody) return;
    
    const ayudas = {
        calendario: {
            titulo: "📅 Guía del Calendario",
            contenido: `
                <h4>¿Cómo usar el Calendario?</h4>
                <p>El calendario te ayuda a organizar tus tareas por día.</p>
                <ul>
                    <li><strong>➕ Añadir tarea:</strong> Toca el botón "+" para crear una nueva tarea.</li>
                    <li><strong>📌 Ver tareas:</strong> Los días con tareas tienen un 📌 en el calendario.</li>
                    <li><strong>✓ Completar tarea:</strong> Toca el botón verde ✓ cuando termines una tarea.</li>
                    <li><strong>🗑️ Eliminar:</strong> Usa el botón rojo para borrar una tarea.</li>
                    <li><strong>👁️ Vistas:</strong> Cambia entre Día, Semana y Mes para diferentes perspectivas.</li>
                </ul>
                <div class="ejemplo">
                    💡 <strong>Ejemplo:</strong> "Estudiar Matemáticas" para mañana a las 10:00 AM
                </div>
                <p>🌸 <em>Mayte te recordará tus tareas importantes.</em></p>
            `
        },
        pomodoro: {
            titulo: "🍅 Guía del Pomodoro Avanzado",
            contenido: `
                <h4>¿Qué es el Pomodoro Avanzado?</h4>
                <p>Es una técnica de estudio que divide tu tiempo en bloques de ESTUDIO y DESCANSO totalmente personalizables.</p>
                
                <h4>📋 Pasos para usar:</h4>
                <ol>
                    <li><strong>Nombre la sesión:</strong> Ej. "Estudiar Programación"</li>
                    <li><strong>Tiempo total (opcional):</strong> Puedes definir cuánto dura toda la sesión.</li>
                    <li><strong>Crea bloques:</strong>
                        <ul>
                            <li>📚 Estudio: Pon la materia que vas a estudiar</li>
                            <li>☕ Descanso: Define qué harás (ej. "Estirarse", "Tomar agua")</li>
                        </ul>
                    </li>
                    <li><strong>Inicia la sesión</strong> y sigue las indicaciones</li>
                </ol>
                
                <h4>📳 Durante la sesión:</h4>
                <ul>
                    <li>El celular VIBRARÁ al terminar cada bloque</li>
                    <li>Mayte te enviará mensajes motivadores</li>
                    <li>Verás qué viene después para que te prepares</li>
                </ul>
                
                <div class="ejemplo">
                    💡 <strong>Ejemplo de sesión de 2 horas:</strong><br>
                    📚 Estudiar React (45 min) → ☕ Descanso (10 min) → 📚 Ejercicios (45 min) → ☕ Estirarse (20 min)
                </div>
            `
        },
        notas: {
            titulo: "📝 Guía de Notas con Prioridad",
            contenido: `
                <h4>¿Cómo organizar tus notas?</h4>
                <p>Cada nota tiene un color según su importancia:</p>
                <ul>
                    <li><strong style="color:#f44336;">🔴 ROJO:</strong> Súper Importante (urgente, crítica)</li>
                    <li><strong style="color:#ff9800;">🟡 AMARILLO:</strong> Importante (debe hacerse pronto)</li>
                    <li><strong style="color:#4caf50;">🟢 VERDE:</strong> Normal (recordatorio suave)</li>
                </ul>
                
                <h4>Funciones:</h4>
                <ul>
                    <li><strong>➕ Nueva nota:</strong> Toca el botón "+"</li>
                    <li><strong>📝 Editar:</strong> Las notas se guardan automáticamente</li>
                    <li><strong>🗑️ Eliminar:</strong> Botón rojo en cada nota</li>
                </ul>
                
                <p>💡 <em>Úsalo para ideas rápidas, listas de compras, o recordatorios importantes.</em></p>
            `
        },
        feynman: {
            titulo: "🧠 Guía de la Técnica Feynman",
            contenido: `
                <h4>¿En qué consiste?</h4>
                <p>La mejor forma de aprender es enseñar. Explica un tema como si se lo enseñaras a un niño de 5 años.</p>
                
                <h4>📋 Pasos:</h4>
                <ol>
                    <li>Elige un tema que quieras dominar</li>
                    <li>Escribe una explicación usando palabras MUY simples</li>
                    <li>Marca el checklist para verificar tu comprensión</li>
                    <li>Si te trabas en algo, ¡ahí está lo que necesitas repasar!</li>
                </ol>
                
                <h4>✅ Checklist de verificación:</h4>
                <ul>
                    <li>✓ ¿Sin palabras técnicas complicadas?</li>
                    <li>✓ ¿Identificaste los conceptos clave?</li>
                    <li>✓ ¿Encontraste áreas donde te trabas?</li>
                    <li>✓ ¿Usaste una analogía o ejemplo?</li>
                </ul>
                
                <div class="ejemplo">
                    💡 <strong>Ejemplo:</strong> En lugar de decir "La fotosíntesis es un proceso anabólico...", di "Las plantas comen luz solar para hacer su comida, como nosotros comemos pizza"
                </div>
                
                <p>🌸 <em>Mayte guarda todas tus explicaciones para que las repases cuando quieras.</em></p>
            `
        }
    };
    
    const ayuda = ayudas[seccion];
    if (ayuda) {
        modalAyudaBody.innerHTML = `
            <h3>${ayuda.titulo}</h3>
            ${ayuda.contenido}
            <button class="btn-primary" style="margin-top: 20px; width: 100%;" onclick="cerrarModalAyuda()">Entendido, gracias 🌸</button>
        `;
        modalAyuda.style.display = 'flex';
    }
}

function cerrarModalAyuda() {
    document.getElementById('modalAyuda').style.display = 'none';
}

// ============ UTILIDADES ============
function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}