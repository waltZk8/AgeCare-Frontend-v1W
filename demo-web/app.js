const STORAGE_KEY = 'agecare-demo-state-v4';
const SESSION_KEY = 'agecare-demo-session-v1';
const { demoAccounts, authenticateDemo } = AgeCareDemoAuth;
const { months, emojis, calendarCells, validDate, formatDate } = AgeCareFeatures;
const PREFERENCES_KEY = 'agecare-demo-preferences-v1';
let calendarYear = 2026;
let calendarMonth = 9;
let selectedDate = '2026-10-09';
let marketQuery = '';
let marketSpecialty = '';
let selectedInquiry = null;
let memoryGame = { cards: [], open: [], matched: [], moves: 0, locked: false };
let triviaIndex = 0;
let triviaFeedback = '';
const chatDrafts = {};

const initialState = () => ({
  role: 'Familia',
  page: 'today',
  mood: null,
  moodSupport: null,
  jokeIndex: 0,
  editRoutineId: null,
  editMedicationId: null,
  contactCaregiverId: null,
  routine: [
    { id: 'r1', title: 'Desayuno', time: '08:30', type: 'Cuidado diario', owner: 'Rosa', done: true },
    { id: 'r2', title: 'Paseo acompañado', time: '10:30', type: 'Bienestar', owner: 'Rosa', done: false },
    { id: 'r3', title: 'Control con médico', time: '16:00', type: 'Cita médica', owner: 'Dr. Núñez', done: false },
    { id: 'r4', title: 'Llamada familiar', time: '19:00', type: 'Familia', owner: 'María', done: false },
  ],
  medications: [
    { id: 'm1', name: 'Metformina', dose: '850 mg', time: '08:00', instructions: 'Con desayuno', taken: true },
    { id: 'm2', name: 'Losartán', dose: '50 mg', time: '14:00', instructions: 'Con comida', taken: false },
    { id: 'm3', name: 'Atorvastatina', dose: '20 mg', time: '21:00', instructions: 'Por la noche', taken: false },
  ],
  chat: [
    { id: 'c1', author: 'María', role: 'Familia', type: 'text', text: 'Hola mamá, ¿cómo amaneciste? ❤️', time: '09:12' },
    { id: 'c2', author: 'Rosa', role: 'Cuidador', type: 'text', text: 'Elena desayunó bien y está de buen ánimo.', time: '09:35' },
    { id: 'c3', author: 'Dr. Núñez', role: 'Médico', type: 'text', text: 'Nos vemos en el control de las 16:00.', time: '10:05' },
    { id: 'c4', author: 'Elena', role: 'Adulto mayor', type: 'audio', duration: '0:03', text: 'Audio ficticio de Elena', time: '10:18' },
  ],
  caregiverChats: [],
  inquiryStatuses: {},
  appointments: AgeCareFeatures.appointments.map((item) => ({ ...item })),
  notifications: [
    { id: 'n1', audiences: ['Familia', 'Cuidador'], title: 'Medicamento sin confirmar', detail: 'Losartán 50 mg · 14:00 · demostración', level: 'attention', readBy: [] },
    { id: 'n2', audiences: ['Familia'], title: 'Nueva observación', detail: 'Rosa registró una nota ficticia.', level: 'info', readBy: [] },
    { id: 'n3', audiences: ['Médico'], title: 'Control programado', detail: 'Elena · hoy 16:00 · agenda ficticia', level: 'info', readBy: [] },
  ],
});

const profiles = {
  Familia: { name: 'María González', description: 'Familia · observa y coordina', initials: 'MG' },
  Cuidador: { name: 'Rosa Medina', description: 'Cuidadora · opera el día', initials: 'RM' },
  Médico: { name: 'Dr. Felipe Núñez', description: 'Médico · organiza salud', initials: 'FN' },
  'Adulto mayor': { name: 'Elena Morales', description: 'Tablet simple · datos ficticios', initials: 'EM' },
};

const navigation = {
  Familia: [
    ['today', '⌂', 'Inicio'], ['health', '♡', 'Salud'], ['routine', '☑', 'Rutina'], ['chat', '◌', 'Familia'], ['marketplace', '♙', 'Cuidadoras'], ['more', '⋯', 'Más'],
  ],
  Cuidador: [
    ['today', '⌂', 'Turno'], ['medications', '✚', 'Medicinas'], ['routine', '☑', 'Rutina'], ['chat', '◌', 'Familia'], ['inquiries', '✉', 'Consultas'], ['more', '⋯', 'Más'],
  ],
  Médico: [
    ['today', '⌂', 'Resumen'], ['health', '♡', 'Salud'], ['medications', '✚', 'Medicinas'], ['routine', '▣', 'Agenda'], ['chat', '◌', 'Equipo'], ['more', '⋯', 'Más'],
  ],
  'Adulto mayor': [
    ['today', '⌂', 'Inicio'], ['chat', '◌', 'Familia'], ['routine', '☑', 'Mi día'], ['entertainment', '☺', 'Diversión'], ['more', '⋯', 'Más'],
  ],
};

const jokes = [
  '—Doctor, cada vez que tomo café me duele el ojo. —Pruebe sacar la cucharita de la taza. ☕',
  '¿Por qué el libro de matemáticas estaba contento? Porque por fin resolvió sus problemas. 😄',
  '—Abuelo, ¿por qué miras tanto el reloj? —Porque el tiempo vuela y quiero verlo despegar. ⏰',
  '¿Qué hace una abeja en el gimnasio? ¡Zum-ba! 🐝',
  '¿Qué le dice un techo a otro? Techo de menos. 🏠',
  '¿Por qué el tomate se puso rojo? Porque vio a la ensalada vestirse. 🍅',
  '¿Qué hace una vaca con los ojos cerrados? Leche concentrada. 🐄',
  '¿Cómo se despiden los químicos? Ácido un placer. 🧪',
  '¿Qué le dijo una taza a otra? ¿Qué taza-ciendo? ☕',
  '¿Cuál es el colmo de un jardinero? Que siempre lo dejen plantado. 🌱',
  '¿Cómo se llama un perro mago? Labracadabrador. 🐶',
  '¿Qué hace un pez? ¡Nada! 🐟',
];
const trivia = [
  { question: '¿Qué instrumento tiene teclas blancas y negras?', answers: ['Piano', 'Violín', 'Tambor'], correct: 0 },
  { question: '¿Cuál de estas flores suele girar hacia el sol?', answers: ['Rosa', 'Girasol', 'Tulipán'], correct: 1 },
  { question: '¿Qué fruta se usa para hacer una limonada?', answers: ['Manzana', 'Uva', 'Limón'], correct: 2 },
  { question: '¿Cuántas estaciones tiene el año?', answers: ['Cuatro', 'Dos', 'Seis'], correct: 0 },
];

const caregivers = [
  { id: 'cg1', name: 'Rosa Medina', age: 41, experience: 8, specialty: 'Geriatría y movilidad', availability: 'Lunes a viernes · día', rating: '4,9', image: 'assets/caregiver-rosa.svg', bio: 'Acompañamiento respetuoso, rutinas diarias y coordinación con la familia.' },
  { id: 'cg2', name: 'Ana Torres', age: 36, experience: 6, specialty: 'Demencia y estimulación', availability: 'Turnos diurnos y fin de semana', rating: '4,8', image: 'assets/caregiver-ana.svg', bio: 'Actividades cognitivas sencillas, conversación y apoyo en la vida diaria.' },
  { id: 'cg3', name: 'Lucía Herrera', age: 52, experience: 12, specialty: 'Cuidados postoperatorios', availability: 'Media jornada', rating: '5,0', image: 'assets/caregiver-lucia.svg', bio: 'Experiencia en recuperación, movilidad segura y registro de observaciones.' },
];

let state = loadState();
let currentRole = loadSession();
let toastTimer;
const content = document.querySelector('#content');
const welcome = document.querySelector('#welcome');
const app = document.querySelector('#app');
const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
const notificationPanel = document.querySelector('#notification-panel');
const notificationButton = document.querySelector('#notifications-button');

function loadState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!value || !Object.hasOwn(profiles, value.role)) return initialState();
    const loaded = { ...initialState(), ...value };
    const defaults = initialState();
    for (const field of ['routine', 'medications', 'chat', 'caregiverChats', 'notifications', 'appointments']) {
      if (!Array.isArray(loaded[field])) loaded[field] = defaults[field];
    }
    if (!loaded.inquiryStatuses || typeof loaded.inquiryStatuses !== 'object' || Array.isArray(loaded.inquiryStatuses)) loaded.inquiryStatuses = {};
    loaded.inquiryStatuses = Object.fromEntries(Object.entries(loaded.inquiryStatuses).filter(([key, status]) => caregivers.some((item) => item.id === key) && ['Pendiente','Respondida','Aceptada','Descartada'].includes(status)));
    loaded.appointments = loaded.appointments.filter((item) => item && validDate(item.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) && ['id','title','clinician','location'].every((key) => typeof item[key] === 'string'));
    return loaded;
  } catch (_) {
    return initialState();
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* degradación segura */ }
}

function profilePreferences() {
  try { return AgeCareFeatures.preferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')?.[state.role]); }
  catch (_) { return AgeCareFeatures.preferences(); }
}
function applyPreferences() {
  const preferences = profilePreferences();
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.textSize = preferences.size;
}
function setPreference(key, value) {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}'); } catch (_) { /* valores predeterminados */ }
  if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
  all[state.role] = AgeCareFeatures.preferences({ ...profilePreferences(), [key]: value });
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all)); } catch (_) { showToast('No se pudo guardar la configuración en este navegador.'); return; }
  render('settings');
}

function loadSession() {
  try {
    const role = localStorage.getItem(SESSION_KEY);
    return Object.hasOwn(profiles, role) ? role : null;
  } catch (_) { return null; }
}

function showLogin() {
  currentRole = null;
  try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* almacenamiento opcional */ }
  closeNotifications();
  app.classList.add('hidden');
  welcome.classList.remove('hidden');
  document.body.classList.remove('role-adult');
  document.documentElement.dataset.theme = 'light';
  document.documentElement.dataset.textSize = 'standard';
  loginForm.reset();
  loginError.classList.add('hidden');
  document.querySelector('#login-email').focus();
}

function enterDemo(role) {
  currentRole = role;
  state.role = role;
  state.page = 'today';
  state.editRoutineId = null;
  state.editMedicationId = null;
  try { localStorage.setItem(SESSION_KEY, role); } catch (_) { /* sesión solo en esta vista */ }
  loginError.classList.add('hidden');
  welcome.classList.add('hidden');
  app.classList.remove('hidden');
  render('today');
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function id(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`; }
function canEditRoutine() { return ['Familia', 'Cuidador', 'Médico'].includes(state.role); }
function canEditMedication() { return state.role === 'Médico'; }

function pageHeader(tag, title, subtitle) {
  return `<section class="page-head"><div><span class="tag">${tag}</span><h1>${title}</h1><p>${subtitle}</p></div></section>`;
}

function patientStrip() {
  return `<div class="patient-strip"><div class="avatar">EM</div><div class="grow"><strong>Elena Morales</strong><small>78 años · perfil completamente ficticio</small></div><button data-action="patient-detail">Ver perfil</button></div>`;
}

function metric(label, value, detail) {
  return `<div class="soft"><small>${label}</small><b>${value}</b><span class="muted">${detail}</span></div>`;
}

function familyDashboard() {
  const pending = state.medications.filter((item) => !item.taken).length;
  return `${pageHeader('Familia · móvil', 'Buenos días, María', 'Observa, coordina y acompaña a Elena.')}${patientStrip()}
    <section class="grid"><article class="card summary"><h3>Resumen de Elena</h3><div class="metric-cards">${metric('Ritmo', '72', 'lpm · simulado')}${metric('SpO₂', '96%', 'simulado')}${metric('Medicinas', `${pending} pend.`, 'hoy')}</div></article>
    <article class="card next-card"><span class="tag">Aviso ficticio</span><h2>Losartán sin confirmar</h2><p class="muted">14:00 · revisa con la cuidadora.</p><button class="primary" data-action="open-notifications">Ver notificaciones</button></article>
    <article class="card timeline"><h3>Próximas actividades</h3>${routinePreview()}</article>
    <article class="card notes"><h3>Círculo familiar</h3><p>Mensajes de familia, cuidadora, médico y Elena.</p><button class="secondary wide" data-page="chat">Abrir chat familiar</button></article>
    <article class="card contact-card"><h3>Buscar cuidadora</h3><p class="muted">Marketplace ficticio exclusivo para la familia.</p><button class="primary wide" data-page="marketplace">Ver cuidadoras</button></article></section>`;
}

function caregiverDashboard() {
  const next = state.medications.find((item) => !item.taken);
  return `${pageHeader('Cuidador · móvil', 'Turno de Rosa', 'Opera la rutina y registra el cuidado cotidiano.')}${patientStrip()}
    <section class="grid"><article class="card next-card"><span class="tag">Próxima medicina</span><h2>${next ? `${escapeHtml(next.name)} ${escapeHtml(next.dose)}` : 'Sin pendientes'}</h2><p class="muted">${next ? `${escapeHtml(next.time)} · ${escapeHtml(next.instructions)}` : 'La demostración está al día.'}</p>${next ? `<button class="primary" data-action="take-medication" data-id="${next.id}">Registrar administrada</button>` : ''}</article>
    <article class="card summary"><h3>Tareas del turno</h3>${routinePreview(true)}</article>
    <article class="card contact-card"><h3>Acciones rápidas</h3><div class="quick-grid"><button data-page="medications">💊<span>Medicinas</span></button><button data-page="routine">🗓️<span>Rutina</span></button><button data-page="chat">💬<span>Familia</span></button><button data-action="incident">⚠️<span>Incidente</span></button></div></article>
    <article class="card notes"><h3>Nota de relevo</h3><p class="muted">Registra observaciones en el chat del círculo.</p><button class="secondary wide" data-page="chat">Escribir observación</button></article></section>`;
}

function doctorDashboard() {
  const appointment = [...state.appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).find((item) => item.date >= '2026-10-08');
  return `${pageHeader('Médico · móvil', 'Panel clínico de Elena', 'Organización de salud con datos de demostración.')}${patientStrip()}
    <section class="grid"><article class="card summary"><h3>Indicadores recientes</h3><div class="metric-cards">${metric('Ritmo', '72 lpm', 'registro de ejemplo')}${metric('SpO₂', '96%', 'registro de ejemplo')}${metric('Sueño', '6,2 h', 'noche anterior')}</div></article>
    <article class="card next-card"><span class="tag">Agenda</span><h2>${appointment ? escapeHtml(appointment.title) : 'Sin controles'}</h2><p class="muted">${appointment ? `${formatDate(appointment.date)} · ${escapeHtml(appointment.time)}` : 'Añade una cita desde Agenda.'}</p><button class="primary" data-page="routine">Organizar agenda</button></article>
    <article class="card timeline"><h3>Organización médica</h3><div class="list"><button class="item item-button" data-page="health"><span class="item-icon">♡</span><span class="grow"><strong>Historia de salud</strong><small>Tendencias y observaciones</small></span></button><button class="item item-button" data-page="medications"><span class="item-icon">✚</span><span class="grow"><strong>Plan de medicamentos</strong><small>Prescribir y ajustar horarios ficticios</small></span></button><button class="item item-button" data-page="chat"><span class="item-icon">◌</span><span class="grow"><strong>Equipo de cuidado</strong><small>Familia y cuidadora</small></span></button></div></article>
    <article class="card notes"><h3>Nota ética</h3><div class="notice">Los valores son sintéticos. No hay diagnóstico, receta ni expediente clínico real.</div></article></section>`;
}

function adultDashboard() {
  const next = [...state.routine].sort((a, b) => a.time.localeCompare(b.time)).find((item) => !item.done);
  return `${pageHeader('Adulto mayor · tablet', 'Hola, Elena 👋', 'Un espacio simple para sentirte acompañada.')}
    <section class="adult-grid"><article class="card adult-main"><h2>¿Cómo te sientes hoy?</h2><div class="mood-grid">${moodButton('Bien', '😀')}${moodButton('Regular', '😐')}${moodButton('Mal', '😟')}</div>${moodResponse()}</article>
    <article class="card next-card adult-next"><h3>Lo próximo</h3><h2>${next ? escapeHtml(next.title) : 'Día completado'}</h2><p>${next ? `${escapeHtml(next.time)} · te acompañaremos` : 'Gracias por registrar tu día.'}</p></article>
    <button class="card adult-action" data-page="chat"><span>💬</span><strong>Mi familia</strong><small>Mensajes, fotos y audios</small></button>
    <button class="card adult-action" data-page="entertainment"><span>😄</span><strong>Diversión</strong><small>Chistes y juegos</small></button>
    <button class="card adult-action" data-page="routine"><span>🗓️</span><strong>Mi día</strong><small>Rutina en letras grandes</small></button></section>`;
}

function moodButton(label, emoji) {
  return `<button class="mood-button ${state.mood === label ? 'selected' : ''}" data-action="mood" data-mood="${label}" aria-pressed="${state.mood === label}"><span>${emoji}</span><strong>${label}</strong></button>`;
}

function moodResponse() {
  if (!state.mood) return '<p class="adult-help">Toca una carita. Tu respuesta se guarda solo en esta demostración.</p>';
  if (state.mood === 'Bien') return '<div class="support-card good"><strong>¡Qué bueno, Elena!</strong><p>Disfruta ese ánimo y comparte un saludo con tu familia.</p><button class="secondary" data-page="chat">Ir a mi familia</button></div>';
  return `<div class="support-card"><strong>Gracias por contarlo.</strong><p>${escapeHtml(state.moodSupport || 'Respira con calma, toma un poco de agua y habla con alguien de confianza.')}</p><p class="joke-inline">${escapeHtml(jokes[state.jokeIndex])}</p><div class="support-actions"><button class="primary" data-page="chat">Hablar con mi familia</button><button class="secondary" data-action="next-joke">Otro chiste</button></div><small>Se generó un aviso local para Familia y Cuidador.</small></div>`;
}

function routinePreview(actions = false) {
  return `<div class="list">${state.routine.slice(0, 4).map((item) => `<div class="item routine-row"><span class="time-badge">${item.done ? '✓' : item.time}</span><div class="grow"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.owner)}</small></div>${actions && !item.done ? `<button class="small-button" data-action="complete-routine" data-id="${item.id}">Listo</button>` : ''}</div>`).join('')}</div>`;
}

function healthPage() {
  const doctor = state.role === 'Médico';
  if (doctor) return doctorHealthPage();
  return `${pageHeader(doctor ? 'Organización médica' : 'Información simulada', doctor ? 'Salud integral de Elena' : 'Salud · Elena', doctor ? 'Tendencias, antecedentes y observaciones en una vista.' : 'La familia observa; los datos no sustituyen una evaluación.')}${patientStrip()}
    <section class="grid"><article class="card chart-card"><h3>Frecuencia cardiaca · 7 registros</h3><div class="chart">${[45, 58, 52, 68, 62, 74, 66].map((height) => `<i class="bar" style="height:${height}%"></i>`).join('')}</div><p class="muted">Simulador local · última actualización 09:40.</p></article>
    <article class="card side-card"><h3>Último registro</h3><div class="big-number">72 <small>lpm</small></div><p class="muted">Rango configurado 55–95 · ficticio</p><div class="notice">Sin diagnóstico automático.</div></article>
    <article class="card summary"><h3>Panel organizado</h3><div class="metric-cards">${metric('SpO₂', '96%', 'umbral 94%')}${metric('Sueño', '6,2 h', '−1,3 h vs. media')}${metric('Actividad', '2.340', 'pasos · simulado')}</div></article>
    <article class="card notes"><h3>Antecedentes registrados</h3><p>Hipertensión · dato de ejemplo</p><p>Control médico · hoy 16:00</p><p class="muted">${doctor ? 'El médico puede organizar cita y medicamentos desde sus pestañas.' : 'Solo lectura para Familia.'}</p></article>
    <article class="card timeline"><h3>Observaciones del equipo</h3><div class="list"><div class="item"><span class="item-icon">RM</span><div class="grow"><strong>Buen apetito y ánimo</strong><small>Rosa · hoy 09:35</small></div></div><div class="item"><span class="item-icon">EM</span><div class="grow"><strong>${state.mood || 'Sin check-in de ánimo'}</strong><small>Elena · demostración</small></div></div></div></article></section>`;
}

function routinePage() {
  if (state.role === 'Médico') return doctorAgendaPage();
  if (state.role === 'Adulto mayor') {
    return `${pageHeader('Mi día · tablet', 'Tu rutina, Elena', 'Una cosa a la vez, con horarios claros.')}<section class="adult-routine">${state.routine.map((item) => `<article class="card adult-routine-item ${item.done ? 'done' : ''}"><span>${item.done ? '✓' : escapeHtml(item.time)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)}</small></div></article>`).join('')}</section>`;
  }
  const editing = state.routine.find((item) => item.id === state.editRoutineId);
  return `${pageHeader('Agenda compartida', state.role === 'Médico' ? 'Agenda médica y rutina' : 'Rutina de Elena', 'Familia, Cuidador y Médico pueden organizar actividades ficticias.')}
    <section class="grid"><article class="card routine-card"><h3>Actividades</h3><div class="list">${state.routine.map((item) => `<div class="item routine-row"><span class="time-badge">${item.done ? '✓' : escapeHtml(item.time)}</span><div class="grow"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)} · por ${escapeHtml(item.owner)}</small></div><div class="item-actions"><button class="small-button" data-action="edit-routine" data-id="${item.id}">Editar</button><button class="small-button danger" data-action="delete-routine" data-id="${item.id}">Quitar</button></div></div>`).join('')}</div></article>
    <article class="card progress-card"><h3>${editing ? 'Modificar actividad' : 'Añadir a la rutina'}</h3><form id="routine-form"><label for="routine-title">Actividad</label><input id="routine-title" required maxlength="80" value="${editing ? escapeHtml(editing.title) : ''}" placeholder="Ej.: Control médico"><label for="routine-time">Hora</label><input id="routine-time" type="time" required value="${editing ? escapeHtml(editing.time) : '12:00'}"><label for="routine-type">Tipo</label><select id="routine-type"><option ${editing?.type === 'Cita médica' ? 'selected' : ''}>Cita médica</option><option ${editing?.type === 'Cuidado diario' ? 'selected' : ''}>Cuidado diario</option><option ${editing?.type === 'Bienestar' ? 'selected' : ''}>Bienestar</option><option ${editing?.type === 'Familia' ? 'selected' : ''}>Familia</option></select><button class="primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir actividad'}</button>${editing ? '<button class="secondary" type="button" data-action="cancel-routine">Cancelar</button>' : ''}</form></article></section>`;
}

function medicationsPage() {
  const editing = state.medications.find((item) => item.id === state.editMedicationId);
  const list = `<div class="list">${state.medications.map((item) => `<div class="item medication-item"><span class="item-icon">${item.taken ? '✓' : '💊'}</span><div class="grow"><strong>${escapeHtml(item.name)} · ${escapeHtml(item.dose)}</strong><small>${escapeHtml(item.time)} · ${escapeHtml(item.instructions)} · ${item.taken ? 'registrada' : 'pendiente'}</small></div>${canEditMedication() ? `<div class="item-actions"><button class="small-button" data-action="edit-medication" data-id="${item.id}">Editar</button><button class="small-button danger" data-action="delete-medication" data-id="${item.id}">Quitar</button></div>` : ''}${state.role === 'Cuidador' && !item.taken ? `<button class="small-button" data-action="take-medication" data-id="${item.id}">Administrada</button>` : ''}</div>`).join('')}</div>`;
  return `${pageHeader('Plan ficticio', 'Medicamentos de Elena', canEditMedication() ? 'El médico organiza el plan de ejemplo.' : 'Información de solo lectura para este perfil.')}
    <section class="grid"><article class="card routine-card"><h3>Plan diario</h3>${list}<div class="notice">Los cambios son locales y no constituyen una prescripción.</div></article>
    ${canEditMedication() ? `<article class="card progress-card"><h3>${editing ? 'Modificar medicamento' : 'Añadir medicamento'}</h3><form id="medication-form"><label for="med-name">Nombre</label><input id="med-name" required maxlength="60" value="${editing ? escapeHtml(editing.name) : ''}" placeholder="Ej.: Vitamina D"><label for="med-dose">Dosis</label><input id="med-dose" required maxlength="30" value="${editing ? escapeHtml(editing.dose) : ''}" placeholder="Ej.: 1 comprimido"><label for="med-time">Hora</label><input id="med-time" type="time" required value="${editing ? escapeHtml(editing.time) : '12:00'}"><label for="med-instructions">Indicaciones</label><input id="med-instructions" maxlength="80" value="${editing ? escapeHtml(editing.instructions) : ''}" placeholder="Ej.: Con comida"><button class="primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir al plan'}</button>${editing ? '<button class="secondary" type="button" data-action="cancel-medication">Cancelar</button>' : ''}</form></article>` : ''}</section>`;
}

function chatPage() {
  const adult = state.role === 'Adulto mayor';
  return `${pageHeader('Círculo de Elena', adult ? 'Mi familia' : state.role === 'Médico' ? 'Equipo de cuidado' : 'Chat familiar', 'María, Rosa, Dr. Núñez y Elena.')}
    <section class="chat-layout"><article class="card chat-card"><div class="chat-list">${state.chat.map(chatBubble).join('')}</div>${chatComposer()}</article>
    <aside class="card chat-info"><h3>Participantes</h3><div class="list"><div class="item"><span class="item-icon">MG</span><div class="grow"><strong>María</strong><small>Familia</small></div></div><div class="item"><span class="item-icon">RM</span><div class="grow"><strong>Rosa</strong><small>Cuidadora</small></div></div><div class="item"><span class="item-icon">FN</span><div class="grow"><strong>Dr. Núñez</strong><small>Médico</small></div></div><div class="item"><span class="item-icon">EM</span><div class="grow"><strong>Elena</strong><small>Adulto mayor</small></div></div></div><div class="notice">Texto y audios son simulados. No se usa micrófono ni se envía información.</div></aside></section>`;
}

function caregiverInboxSection() {
  const conversations = caregivers.map((caregiver) => ({
    caregiver,
    messages: state.caregiverChats.filter((message) => message.caregiverId === caregiver.id),
  })).filter(({ messages }) => messages.length);

  const selected = conversations.find(({ caregiver }) => caregiver.id === selectedInquiry);
  return `<section class="card caregiver-inbox"><h2>Mensajes de Familia</h2><div class="inquiry-list">${conversations.length ? conversations.map(({ caregiver, messages }) => `<button class="inquiry-summary ${selectedInquiry === caregiver.id ? 'selected' : ''}" data-action="open-inquiry" data-id="${caregiver.id}"><img src="${caregiver.image}" alt=""><span><strong>${escapeHtml(caregiver.name)}</strong><small>${escapeHtml(messages.at(-1).text)}</small><span class="status-chip">${inquiryStatus(caregiver.id)}</span></span><span aria-hidden="true">›</span></button>`).join('') : '<div class="empty-state"><strong>Aún no hay consultas</strong><span>Las consultas del marketplace aparecerán aquí.</span></div>'}</div></section>
    ${selected ? `<section class="card caregiver-conversation"><div class="section-heading"><h2>${escapeHtml(selected.caregiver.name)}</h2><span class="status-chip">${inquiryStatus(selected.caregiver.id)}</span></div><p class="muted">Consulta de María · perfil ficticio del catálogo</p><div class="chat-list">${selected.messages.map((message) => caregiverChatBubble(message, 'Cuidador')).join('')}</div><form class="caregiver-reply-form" data-caregiver-id="${selected.caregiver.id}"><label for="caregiver-reply-${selected.caregiver.id}">Respuesta para María</label><textarea id="caregiver-reply-${selected.caregiver.id}" name="message" maxlength="600" required placeholder="Escribe tu respuesta…"></textarea>${emojiPicker(`caregiver-reply-${selected.caregiver.id}`)}<button class="primary" type="submit">Enviar respuesta</button></form><div class="button-row"><button class="secondary" data-action="inquiry-status" data-id="${selected.caregiver.id}" data-status="Aceptada">Aceptar disponibilidad</button><button class="secondary danger" data-action="inquiry-status" data-id="${selected.caregiver.id}" data-status="Descartada">Descartar consulta</button></div><small class="muted">No genera contratos ni pagos.</small></section>` : ''}`;
}

function chatBubble(item) {
  const mine = item.role === state.role;
  return `<div class="chat-bubble ${mine ? 'mine' : ''}"><strong>${escapeHtml(item.author)} <small>${escapeHtml(item.role)}</small></strong>${item.type === 'audio' ? `<span class="media-caption">Audio de ejemplo · ${escapeHtml(item.duration)}</span><audio controls preload="none" src="assets/demo-audio.wav" aria-label="Reproducir audio de ejemplo"></audio>` : item.type === 'photo' ? '<img class="chat-photo" src="assets/demo-photo.svg" alt="Ilustración de un jardín con flores"><span class="media-caption">Foto de ejemplo</span>' : `<p>${escapeHtml(item.text)}</p>`}<time>${escapeHtml(item.time)}</time></div>`;
}

function caregiverChatBubble(item, currentRole) {
  const role = item.role || 'Familia';
  const author = item.author || 'María';
  return `<div class="chat-bubble ${role === currentRole ? 'mine' : ''}"><strong>${escapeHtml(author)} <small>${escapeHtml(role)}</small></strong><p>${escapeHtml(item.text)}</p><time>${escapeHtml(item.time || 'Ahora')}</time></div>`;
}

function marketplacePage() {
  if (state.role !== 'Familia') return accessDenied('El marketplace de cuidadoras es exclusivo para Familia.');
  const selected = caregivers.find((item) => item.id === state.contactCaregiverId);
  const results = caregivers.filter((item) => `${item.name} ${item.specialty}`.toLocaleLowerCase('es').includes(marketQuery.toLocaleLowerCase('es')) && (!marketSpecialty || item.id === marketSpecialty));
  return `${pageHeader('Perfiles de ejemplo', 'Encuentra apoyo para Elena', 'Compara experiencia, especialidad y disponibilidad.')}
    ${selected ? `<section class="card marketplace-chat"><div class="section-heading"><h2>${escapeHtml(selected.name)}</h2><span class="status-chip">${inquiryStatus(selected.id)}</span></div><div class="chat-list">${state.caregiverChats.filter((item) => item.caregiverId === selected.id).map((item) => caregiverChatBubble(item, 'Familia')).join('')}</div><form id="caregiver-contact-form"><label for="caregiver-message">Tu consulta</label><textarea id="caregiver-message" maxlength="600" required placeholder="¿Qué apoyo necesita Elena?"></textarea>${emojiPicker('caregiver-message')}<button class="primary" type="submit">Enviar consulta</button><button class="secondary" type="button" data-action="close-caregiver">Volver al catálogo</button></form><small class="muted">Conversación local. Sin contratación real.</small></section>` : ''}
    <form id="marketplace-filter" class="card marketplace-filter"><label for="market-query">Nombre o especialidad</label><input id="market-query" type="search" maxlength="80" value="${escapeHtml(marketQuery)}" placeholder="Ej.: movilidad"><label for="market-specialty">Especialidad</label><select id="market-specialty"><option value="">Todas las especialidades</option>${caregivers.map((item) => `<option value="${item.id}" ${item.id === marketSpecialty ? 'selected' : ''}>${escapeHtml(item.specialty)}</option>`).join('')}</select><div class="button-row"><button class="primary" type="submit">Buscar</button><button class="secondary" type="button" data-action="clear-market-filters">Limpiar</button></div></form><p class="results-count">${results.length} perfiles de ejemplo</p>
    <section class="marketplace-grid">${results.length ? results.map((item) => `<article class="card caregiver-card"><div class="caregiver-card-header"><img src="${item.image}" alt="Retrato ilustrado de ${escapeHtml(item.name)}"><div><span class="tag">★ ${item.rating}</span><h2>${escapeHtml(item.name)}</h2><p>${item.age} años</p></div></div><div class="caregiver-body"><dl class="caregiver-details"><div><dt>Experiencia</dt><dd>${item.experience} años</dd></div><div><dt>Especialidad</dt><dd>${escapeHtml(item.specialty)}</dd></div><div><dt>Disponibilidad</dt><dd>${escapeHtml(item.availability)}</dd></div></dl><p>${escapeHtml(item.bio)}</p><button class="primary wide" data-action="contact-caregiver" data-id="${item.id}">${state.caregiverChats.some((message) => message.caregiverId === item.id) ? 'Ver conversación' : 'Enviar consulta'}</button>${state.caregiverChats.some((message) => message.caregiverId === item.id) ? `<span class="status-chip">${inquiryStatus(item.id)}</span>` : ''}</div></article>`).join('') : '<div class="card empty-state">No hay perfiles con esos filtros. Prueba otra búsqueda.</div>'}</section>`;
}

function entertainmentPage() {
  if (state.role !== 'Adulto mayor') return accessDenied('Diversión está adaptada para el perfil Adulto mayor.');
  if (!memoryGame.cards.length) startMemoryGame();
  const question = trivia[triviaIndex];
  return `${pageHeader('Tu tiempo libre', 'Disfruta un rato', 'Elige lo que te apetezca, sin prisa.')}
    <section class="fun-grid"><article class="card joke-card"><span>😄</span><h2>${escapeHtml(jokes[state.jokeIndex % jokes.length])}</h2><div><button class="primary" data-action="next-joke">Otro chiste</button><button class="secondary" data-action="joke-helped">Me hizo reír</button></div></article>
    <article class="card memory-section"><h2>Encuentra las parejas</h2><p>Toca dos tarjetas con el mismo dibujo.</p><div class="memory-grid">${memoryGame.cards.map((symbol, index) => { const visible = memoryGame.open.includes(index) || memoryGame.matched.includes(index); return `<button class="memory-card ${memoryGame.matched.includes(index) ? 'matched' : ''}" data-action="memory-card" data-index="${index}" ${memoryGame.matched.includes(index) || memoryGame.locked ? 'disabled' : ''} aria-label="Tarjeta ${index + 1}${visible ? `: ${symbol}` : ': oculta'}">${visible ? symbol : '❖'}</button>`; }).join('')}</div><p role="status">${memoryGame.matched.length === 8 ? '¡Encontraste todas las parejas!' : `${memoryGame.matched.length / 2} de 4 parejas · ${memoryGame.moves} intentos`}</p><button class="secondary" data-action="restart-memory">Nueva partida</button></article>
    <article class="card trivia-card"><h2>Una pregunta para jugar</h2><p>${question.question}</p><div class="trivia-answers">${question.answers.map((answer, index) => `<button class="secondary" data-action="trivia-answer" data-index="${index}">${answer}</button>`).join('')}</div><p class="trivia-feedback" role="status">${triviaFeedback}</p><button class="primary" data-action="next-trivia">Otra pregunta</button></article>
    <article class="card calm-card"><span>🌿</span><h2>Pausa tranquila</h2><div class="breathing-circle" aria-hidden="true">Respira</div><p>Respira a tu ritmo. Puedes detenerte cuando quieras.</p><button class="secondary" data-page="chat">Compartir con mi familia</button></article></section>`;
}

function morePage() {
  return `${pageHeader('Tu espacio', 'Más', 'Opciones de AgeCare.')}<section class="more-menu"><button class="card menu-link" data-page="settings"><span>⚙️</span><div><strong>Configuración</strong><small>Apariencia y tamaño de letra</small></div><span>›</span></button><button class="card menu-link" data-page="about"><span>ⓘ</span><div><strong>Acerca de AgeCare</strong><small>Qué incluye esta versión</small></div><span>›</span></button><article class="card"><h2>Datos de prueba</h2><p class="muted">Reinicia actividades, mensajes y controles. Tus preferencias se conservan.</p><button class="secondary danger wide" data-action="reset">Reiniciar demostración</button></article></section>`;
}

function accessDenied(message) {
  return `${pageHeader('Acceso por perfil', 'Sección no disponible', message)}<article class="card empty"><span class="item-icon">🔒</span><h3>Cambia al perfil correspondiente</h3><button class="primary" data-page="today">Volver al inicio</button></article>`;
}

const pages = { today: () => state.role === 'Familia' ? familyDashboard() : state.role === 'Cuidador' ? caregiverDashboard() : state.role === 'Médico' ? doctorDashboard() : adultDashboard(), health: healthPage, routine: routinePage, medications: medicationsPage, chat: chatPage, marketplace: marketplacePage, inquiries: inquiriesPage, entertainment: entertainmentPage, more: morePage, settings: settingsPage, about: aboutPage };

function render(page = state.page) {
  if (!currentRole) return;
  state.role = currentRole;
  const allowed = ['settings', 'about'].includes(page) || navigation[state.role].some(([key]) => key === page);
  state.page = pages[page] && allowed ? page : 'today';
  document.body.classList.toggle('role-adult', state.role === 'Adulto mayor');
  app.classList.toggle('wide-marketplace', state.page === 'marketplace');
  applyPreferences();
  content.innerHTML = pages[state.page]();
  updateProfile();
  updateNavigation();
  updateNotifications();
  saveState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProfile() {
  const profile = profiles[state.role];
  document.querySelector('#role-label').textContent = state.role;
  document.querySelector('#profile-name').textContent = profile.name;
  document.querySelector('#profile-description').textContent = profile.description;
  document.querySelector('#profile-avatar').textContent = profile.initials;
}

function updateNavigation() {
  const items = navigation[state.role];
  for (const navigationElement of [document.querySelector('#nav'), document.querySelector('#mobile-nav')]) {
    navigationElement.style.setProperty('--nav-count', items.length);
    navigationElement.innerHTML = items.map(([page, icon, label]) => `<button data-page="${page}" class="${page === state.page || (page === 'more' && ['settings', 'about'].includes(state.page)) ? 'active' : ''}" aria-label="${label}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('');
  }
}

function visibleNotifications() { return state.notifications.filter((item) => item.audiences.includes(state.role)); }

function updateNotifications() {
  const items = visibleNotifications();
  const unread = items.filter((item) => !item.readBy.includes(state.role)).length;
  const count = document.querySelector('#notification-count');
  count.textContent = unread;
  count.classList.toggle('hidden', unread === 0);
  document.querySelector('#notification-list').innerHTML = items.length ? items.map((item) => `<button class="notification-item ${item.readBy.includes(state.role) ? 'read' : ''}" data-action="read-notification" data-id="${item.id}"><span class="notification-level ${item.level}"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join('') : '<div class="empty-state"><strong>Sin avisos para este perfil</strong><span>La demostración está al día.</span></div>';
}

function notify(audiences, title, detail, level = 'info') { state.notifications.unshift({ id: id('n'), audiences, title, detail, level, readBy: [] }); }
function openNotifications() { notificationPanel.classList.remove('hidden'); notificationButton.setAttribute('aria-expanded', 'true'); }
function closeNotifications() { notificationPanel.classList.add('hidden'); notificationButton.setAttribute('aria-expanded', 'false'); }
function showToast(message) { const toast = document.querySelector('#toast'); clearTimeout(toastTimer); toast.textContent = message; toast.classList.remove('hidden'); toastTimer = setTimeout(() => toast.classList.add('hidden'), 3400); }

function authorForRole() { return state.role === 'Familia' ? 'María' : state.role === 'Cuidador' ? 'Rosa' : state.role === 'Médico' ? 'Dr. Núñez' : 'Elena'; }

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const role = authenticateDemo(document.querySelector('#login-email').value, document.querySelector('#login-password').value);
  if (!role) {
    loginError.textContent = 'Correo o contraseña de demostración incorrectos.';
    loginError.classList.remove('hidden');
    document.querySelector('#login-password').focus();
    return;
  }
  enterDemo(role);
});
document.querySelectorAll('[data-demo-role]').forEach((button) => button.addEventListener('click', () => {
  const account = Object.entries(demoAccounts).find(([, details]) => details.role === button.dataset.demoRole);
  if (!account) return;
  document.querySelector('#login-email').value = account[0];
  document.querySelector('#login-password').value = account[1].password;
  loginError.classList.add('hidden');
  document.querySelector('#enter').focus();
}));
document.querySelector('#logout').addEventListener('click', showLogin);
notificationButton.addEventListener('click', () => { notificationPanel.classList.contains('hidden') ? openNotifications() : closeNotifications(); });

document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentRole) return;
  if (event.target.id === 'routine-form') {
    if (!canEditRoutine() || state.role === 'Médico') return;
    const data = { title: document.querySelector('#routine-title').value.trim(), time: document.querySelector('#routine-time').value, type: document.querySelector('#routine-type').value };
    if (!data.title || !data.time) return;
    const existing = state.routine.find((item) => item.id === state.editRoutineId);
    if (existing) Object.assign(existing, data, { owner: authorForRole() }); else state.routine.push({ id: id('r'), ...data, owner: authorForRole(), done: false });
    notify(['Familia', 'Cuidador', 'Médico'], 'Rutina actualizada', `${data.title} · ${data.time} · por ${authorForRole()}`, 'success');
    state.editRoutineId = null; showToast('Rutina actualizada localmente.'); render('routine');
  }
  if (event.target.id === 'medication-form') {
    if (!canEditMedication()) return;
    const data = { name: document.querySelector('#med-name').value.trim(), dose: document.querySelector('#med-dose').value.trim(), time: document.querySelector('#med-time').value, instructions: document.querySelector('#med-instructions').value.trim() || 'Sin indicación' };
    if (!data.name || !data.dose || !data.time) return;
    const existing = state.medications.find((item) => item.id === state.editMedicationId);
    if (existing) Object.assign(existing, data); else state.medications.push({ id: id('m'), ...data, taken: false });
    notify(['Familia', 'Cuidador', 'Médico'], 'Plan de medicamentos actualizado', `${data.name} · ${data.dose} · ${data.time}`, 'attention');
    state.editMedicationId = null; showToast('Medicamento guardado solo en la demo.'); render('medications');
  }
  if (event.target.id === 'chat-form') {
    const field = document.querySelector('#chat-message'); const text = field.value.trim(); if (!text) return;
    state.chat.push({ id: id('c'), author: authorForRole(), role: state.role, type: 'text', text, time: 'Ahora' });
    notify(Object.keys(profiles).filter((role) => role !== state.role), 'Nuevo mensaje del círculo', `${authorForRole()}: ${text}`, 'info');
    chatDrafts[state.role] = ''; showToast('Mensaje añadido al chat.'); render('chat');
  }
  if (event.target.id === 'caregiver-contact-form') {
    if (state.role !== 'Familia') return;
    const field = document.querySelector('#caregiver-message'); const text = field.value.trim(); if (!text) return;
    const caregiver = caregivers.find((item) => item.id === state.contactCaregiverId);
    if (!caregiver) return;
    state.caregiverChats.push({ id: id('mc'), caregiverId: caregiver.id, author: authorForRole(), role: state.role, text, time: 'Ahora' });
    if (!['Aceptada', 'Descartada'].includes(state.inquiryStatuses[caregiver.id])) state.inquiryStatuses[caregiver.id] = 'Pendiente';
    notify(['Cuidador'], 'Nuevo mensaje de Familia', `María contactó a ${caregiver.name}.`, 'info');
    showToast(`Mensaje enviado a ${caregiver.name} en la demo.`); render('marketplace');
  }
  if (event.target.matches('.caregiver-reply-form')) {
    if (state.role !== 'Cuidador') return;
    const caregiverId = event.target.dataset.caregiverId;
    const caregiver = caregivers.find((item) => item.id === caregiverId);
    const text = event.target.querySelector('textarea[name="message"]').value.trim();
    if (!caregiver || !text) return;
    state.caregiverChats.push({ id: id('mc'), caregiverId, author: caregiver.name, role: state.role, text, time: 'Ahora' });
    if (!['Aceptada', 'Descartada'].includes(state.inquiryStatuses[caregiverId])) state.inquiryStatuses[caregiverId] = 'Respondida';
    notify(['Familia'], 'Respuesta de la cuidadora', `${caregiver.name}: ${text}`, 'info');
    showToast(`Respuesta enviada a la familia desde ${caregiver.name}.`); render('inquiries');
  }
  if (event.target.id === 'marketplace-filter' && state.role === 'Familia') {
    marketQuery = document.querySelector('#market-query').value.trim();
    marketSpecialty = document.querySelector('#market-specialty').value;
    render('marketplace');
  }
  if (event.target.id === 'appointment-form' && state.role === 'Médico') {
    const date = document.querySelector('#appointment-date').value;
    const time = document.querySelector('#appointment-time').value;
    const title = document.querySelector('#appointment-title').value.trim();
    if (!title || !validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { showToast('Revisa el nombre, la fecha y la hora.'); return; }
    if (state.appointments.some((item) => item.date === date && item.time === time)) { showToast('Ya hay un control en esa fecha y hora.'); return; }
    state.appointments.push({ id: id('a'), date, time, title: title.slice(0, 80), clinician: profiles[state.role].name, location: document.querySelector('#appointment-location').value.trim().slice(0, 80) || 'Consulta de ejemplo', note: '' });
    [calendarYear, calendarMonth] = date.split('-').slice(0, 2).map(Number); calendarMonth--;
    selectedDate = date;
    notify(['Familia', 'Cuidador'], 'Nuevo control', `${title} · ${formatDate(date)} · ${time}`, 'info');
    showToast('Control añadido a la agenda de prueba.'); render('routine');
  }
});

document.addEventListener('change', (event) => {
  if (currentRole !== 'Médico') return;
  if (event.target.id === 'calendar-month' || event.target.id === 'calendar-year') {
    const year = Number(document.querySelector('#calendar-year').value);
    const month = Number(document.querySelector('#calendar-month').value);
    if (!calendarCells(year, month).length) { showToast('Elige un año entre 1900 y 2100.'); return; }
    calendarYear = year; calendarMonth = month;
    selectedDate = `${year}-${String(month + 1).padStart(2,'0')}-01`;
    render('routine');
  }
});
document.addEventListener('input', (event) => {
  if (currentRole && event.target.id === 'chat-message') chatDrafts[state.role] = event.target.value;
});

document.addEventListener('click', (event) => {
  if (!currentRole) return;
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget) { render(pageTarget.dataset.page); return; }
  const target = event.target.closest('[data-action]'); if (!target) return;
  const action = target.dataset.action;
  if (['edit-medication', 'delete-medication', 'cancel-medication'].includes(action) && !canEditMedication()) return;
  if (['edit-routine', 'delete-routine', 'cancel-routine'].includes(action) && !['Familia', 'Cuidador'].includes(state.role)) return;
  if (action === 'take-medication' && state.role !== 'Cuidador') return;
  if (action === 'complete-routine' && !['Familia', 'Cuidador'].includes(state.role)) return;
  if (['mood','joke-helped','next-joke','memory-card','restart-memory','trivia-answer','next-trivia'].includes(action) && state.role !== 'Adulto mayor') return;
  if (['contact-caregiver', 'close-caregiver', 'clear-market-filters'].includes(action) && state.role !== 'Familia') return;
  if (['open-inquiry','inquiry-status'].includes(action) && state.role !== 'Cuidador') return;
  if (['calendar-prev','calendar-next','calendar-day','delete-appointment'].includes(action) && state.role !== 'Médico') return;
  if (action === 'set-theme') { setPreference('theme', target.dataset.value); return; }
  if (action === 'set-size') { setPreference('size', target.dataset.value); return; }
  if (action === 'insert-emoji') {
    const field = document.getElementById(target.dataset.field);
    if (!field || !emojis.includes(target.dataset.emoji)) return;
    const emoji = target.dataset.emoji;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;
    if (field.value.length - (end - start) + emoji.length > field.maxLength) return;
    field.setRangeText(emoji, start, end, 'end');
    if (field.id === 'chat-message') chatDrafts[state.role] = field.value;
    field.focus(); return;
  }
  if (action === 'open-inquiry') { selectedInquiry = target.dataset.id; render('inquiries'); return; }
  if (action === 'inquiry-status') {
    const caregiver = caregivers.find((item) => item.id === target.dataset.id);
    if (!caregiver || !state.caregiverChats.some((item) => item.caregiverId === caregiver.id) || !['Aceptada','Descartada'].includes(target.dataset.status)) return;
    state.inquiryStatuses[caregiver.id] = target.dataset.status;
    notify(['Familia'], 'Consulta actualizada', `${caregiver.name} · ${target.dataset.status}`, 'info'); render('inquiries'); return;
  }
  if (action === 'clear-market-filters') { marketQuery = ''; marketSpecialty = ''; render('marketplace'); return; }
  if (action === 'calendar-day' && validDate(target.dataset.date)) { selectedDate = target.dataset.date; render('routine'); return; }
  if (action === 'calendar-prev' || action === 'calendar-next') {
    const date = new Date(calendarYear, calendarMonth + (action === 'calendar-next' ? 1 : -1), 1);
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return;
    calendarYear = date.getFullYear(); calendarMonth = date.getMonth(); selectedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2,'0')}-01`; render('routine'); return;
  }
  if (action === 'delete-appointment') { state.appointments = state.appointments.filter((item) => item.id !== target.dataset.id); render('routine'); return; }
  if (action === 'memory-card') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < 8) memoryCard(index); return; }
  if (action === 'restart-memory') { startMemoryGame(); render('entertainment'); return; }
  if (action === 'trivia-answer') { triviaFeedback = Number(target.dataset.index) === trivia[triviaIndex].correct ? '¡Correcto! 😊' : 'Prueba otra opción; no hay prisa.'; render('entertainment'); return; }
  if (action === 'next-trivia') { triviaIndex = (triviaIndex + 1) % trivia.length; triviaFeedback = ''; render('entertainment'); return; }
  if (action === 'open-notifications') openNotifications();
  if (action === 'close-notifications') closeNotifications();
  if (action === 'read-all') { visibleNotifications().forEach((item) => { if (!item.readBy.includes(state.role)) item.readBy.push(state.role); }); showToast('Avisos leídos para este perfil.'); updateNotifications(); saveState(); }
  if (action === 'read-notification') { const item = state.notifications.find((notice) => notice.id === target.dataset.id); if (item && !item.readBy.includes(state.role)) item.readBy.push(state.role); updateNotifications(); saveState(); }
  if (action === 'patient-detail') showToast('Elena Morales · perfil ficticio · sin evaluación clínica real.');
  if (action === 'incident') showToast('Incidentes reales siguen deshabilitados hasta contar con entrega y acuse confiables.');
  if (action === 'complete-routine') { const item = state.routine.find((entry) => entry.id === target.dataset.id); if (item) item.done = true; notify(['Familia', 'Cuidador'], 'Actividad completada', `${item?.title || 'Actividad'} · demostración`, 'success'); showToast('Actividad registrada.'); render(); }
  if (action === 'edit-routine') { state.editRoutineId = target.dataset.id; render('routine'); }
  if (action === 'cancel-routine') { state.editRoutineId = null; render('routine'); }
  if (action === 'delete-routine') { state.routine = state.routine.filter((item) => item.id !== target.dataset.id); showToast('Actividad retirada de la demo.'); render('routine'); }
  if (action === 'edit-medication') { state.editMedicationId = target.dataset.id; render('medications'); }
  if (action === 'cancel-medication') { state.editMedicationId = null; render('medications'); }
  if (action === 'delete-medication') { state.medications = state.medications.filter((item) => item.id !== target.dataset.id); notify(['Familia', 'Cuidador', 'Médico'], 'Plan de medicamentos modificado', 'Se retiró un medicamento de la demostración.', 'attention'); showToast('Medicamento retirado de la demo.'); render('medications'); }
  if (action === 'take-medication') { const item = state.medications.find((entry) => entry.id === target.dataset.id); if (item) item.taken = true; notify(['Familia', 'Cuidador'], 'Medicamento registrado', `${item?.name || 'Medicamento'} · administrado en la demo`, 'success'); showToast('Administración ficticia registrada.'); render(); }
  if (action === 'mood') {
    state.mood = target.dataset.mood;
    if (state.mood !== 'Bien') {
      state.moodSupport = state.mood === 'Mal' ? 'No estás sola. Si te sientes mal físicamente, habla con tu cuidadora o familia.' : 'Tómate un momento tranquilo y cuéntale a tu familia cómo estás.';
      notify(['Familia', 'Cuidador'], 'Estado de ánimo de Elena', `Elena indicó “${state.mood}”. Conviene acompañarla.`, 'attention');
      showToast('Familia y Cuidador recibieron un aviso local.');
    } else { state.moodSupport = null; notify(['Familia', 'Cuidador'], 'Check-in positivo', 'Elena indicó que se siente bien.', 'success'); showToast('Ánimo registrado en la demostración.'); }
    render('today');
  }
  if (action === 'next-joke') { state.jokeIndex = (state.jokeIndex + 1) % jokes.length; render(state.page); }
  if (action === 'joke-helped') { state.mood = 'Bien'; state.moodSupport = null; notify(['Familia', 'Cuidador'], 'El ánimo mejoró', 'Elena indicó que el chiste le hizo reír.', 'success'); showToast('¡Qué bueno! Se avisó localmente al círculo.'); render('entertainment'); }
  if (action === 'send-audio' || action === 'send-photo') {
    const type = action === 'send-photo' ? 'photo' : 'audio';
    state.chat.push({ id: id('c'), author: authorForRole(), role: state.role, type, duration: '0:03', text: type === 'photo' ? 'Foto de ejemplo' : 'Audio de ejemplo', time: 'Ahora' });
    notify(Object.keys(profiles).filter((role) => role !== state.role), type === 'photo' ? 'Foto del círculo' : 'Audio del círculo', `${authorForRole()} envió un ejemplo.`, 'info');
    showToast(type === 'photo' ? 'Foto de ejemplo añadida.' : 'Audio de ejemplo añadido.'); render('chat');
  }
  if (action === 'play-audio') showToast('Reproducción simulada: no se accedió al micrófono ni a archivos externos.');
  if (action === 'contact-caregiver') { state.contactCaregiverId = target.dataset.id; render('marketplace'); setTimeout(() => document.querySelector('.marketplace-chat')?.scrollIntoView({ behavior: 'smooth' }), 0); }
  if (action === 'close-caregiver') { state.contactCaregiverId = null; render('marketplace'); }
  if (action === 'reset') { state = initialState(); Object.keys(chatDrafts).forEach((role) => delete chatDrafts[role]); selectedInquiry = null; marketQuery = ''; marketSpecialty = ''; startMemoryGame(); closeNotifications(); showToast('Demostración reiniciada.'); render('today'); }
});

window.addEventListener('online', () => showToast('Conexión disponible. La demo continúa local.'));
window.addEventListener('offline', () => showToast('Sin conexión. El estado local se conserva.'));
if (currentRole) enterDemo(currentRole);
updateProfile(); updateNavigation(); updateNotifications();

function doctorHealthPage() {
  return `${pageHeader('Ficha de ejemplo', 'Salud de Elena', 'Registros ficticios para revisar con el equipo.')}${patientStrip()}
    <section class="health-overview"><article class="card"><h2>Últimas mediciones</h2><p class="muted">8 oct. 2026 · 09:30 · registro de Rosa</p><div class="vitals-grid">${metric('Presión arterial', '128/78', 'mmHg')}${metric('Pulso', '72', 'latidos/min')}${metric('Oxígeno', '96%', 'SpO₂')}${metric('Temperatura', '36,5 °C', 'registro de ejemplo')}${metric('Sueño', '6 h 12 min', 'noche anterior')}${metric('Actividad', '2.340', 'pasos registrados')}</div><p class="small-note">Sin interpretación clínica automática.</p></article>
    <article class="card"><h2>Antecedentes</h2><dl class="clinical-details"><div><dt>Condiciones registradas</dt><dd>Hipertensión y diabetes tipo 2 · ejemplos</dd></div><div><dt>Alergias</dt><dd>Penicilina · antecedente ficticio</dd></div><div><dt>Movilidad</dt><dd>Paseos acompañados; utiliza bastón en exteriores.</dd></div><div><dt>Apoyo diario</dt><dd>Rosa acompaña la rutina; María coordina los controles.</dd></div></dl></article>
    <article class="card"><h2>Registros de la semana</h2><div class="table-scroll"><table class="health-table"><caption>Mediciones ficticias · octubre de 2026</caption><thead><tr><th>Fecha</th><th>Presión<br>mmHg</th><th>Pulso<br>lpm</th><th>SpO₂</th></tr></thead><tbody><tr><th>6 oct.</th><td>130/80</td><td>74</td><td>97%</td></tr><tr><th>7 oct.</th><td>126/78</td><td>70</td><td>96%</td></tr><tr><th>8 oct.</th><td>128/78</td><td>72</td><td>96%</td></tr></tbody></table></div></article>
    <article class="card"><h2>Plan y observaciones</h2><div class="list"><div class="item"><span class="item-icon">💊</span><div class="grow"><strong>${state.medications.filter((item) => item.taken).length} de ${state.medications.length} administraciones registradas</strong><small>Confirmaciones locales del día</small></div></div><div class="item"><span class="item-icon">💬</span><div class="grow"><strong>Rosa · 8 oct., 09:35</strong><small>Buen apetito en el desayuno. Paseo acompañado pendiente.</small></div></div><div class="item"><span class="item-icon">😊</span><div class="grow"><strong>Ánimo: ${escapeHtml(state.mood || 'sin respuesta')}</strong><small>Respuesta de Elena en esta demo</small></div></div></div><div class="button-row"><button class="secondary" data-page="medications">Ver medicamentos</button><button class="primary" data-page="routine">Ver controles</button></div></article></section>`;
}

function doctorAgendaPage() {
  const events = state.appointments.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const monthEvents = state.appointments.filter((item) => item.date.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return `${pageHeader('Agenda de Elena', 'Controles médicos', 'Selecciona un día para revisar sus citas.')}
    <section class="card calendar-card"><div class="calendar-controls"><button class="secondary" data-action="calendar-prev" aria-label="Mes anterior">‹</button><label>Mes<select id="calendar-month">${months.map((month, index) => `<option value="${index}" ${index === calendarMonth ? 'selected' : ''}>${month}</option>`).join('')}</select></label><label>Año<input id="calendar-year" type="number" min="1900" max="2100" value="${calendarYear}"></label><button class="secondary" data-action="calendar-next" aria-label="Mes siguiente">›</button></div>
    <h2>${months[calendarMonth]} de ${calendarYear}</h2><div class="calendar-week" aria-hidden="true">${['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map((day) => `<span>${day}</span>`).join('')}</div><div class="calendar-grid" aria-label="Días de ${months[calendarMonth]}">${calendarCells(calendarYear, calendarMonth).map((date) => { if (!date) return '<span class="calendar-empty"></span>'; const count = state.appointments.filter((item) => item.date === date).length; return `<button class="calendar-day ${date === selectedDate ? 'selected' : ''} ${count ? 'has-appointment' : ''}" data-action="calendar-day" data-date="${date}" aria-pressed="${date === selectedDate}" aria-label="${formatDate(date)}${count ? `, ${count} control${count > 1 ? 'es' : ''}` : ', sin controles'}"><span>${Number(date.slice(-2))}</span>${count ? '<i aria-hidden="true"></i>' : ''}</button>`; }).join('')}</div><p class="calendar-legend"><span></span> Día con control</p></section>
    <section class="card selected-appointments" aria-live="polite"><h2>${formatDate(selectedDate)}</h2>${events.length ? events.map(appointmentCard).join('') : '<p class="muted">Sin controles para este día.</p>'}</section>
    <section class="card"><h2>Controles del mes</h2>${monthEvents.length ? monthEvents.map((item) => `<button class="appointment-summary" data-action="calendar-day" data-date="${item.date}"><span class="time-badge">${item.date.slice(-2)} ${months[calendarMonth].slice(0,3).toLowerCase()}</span><span><strong>${escapeHtml(item.title)}</strong><small>Elena Morales · ${escapeHtml(item.time)}</small></span></button>`).join('') : '<p class="muted">Este mes no tiene controles.</p>'}</section>
    <section class="card"><h2>Programar un control</h2><form id="appointment-form"><label for="appointment-title">Control</label><input id="appointment-title" required maxlength="80" placeholder="Ej.: Control general"><div class="form-pair"><div><label for="appointment-date">Fecha</label><input id="appointment-date" type="date" min="1900-01-01" max="2100-12-31" value="${selectedDate}" required></div><div><label for="appointment-time">Hora</label><input id="appointment-time" type="time" value="10:00" required></div></div><label for="appointment-location">Lugar</label><input id="appointment-location" maxlength="80" placeholder="Consulta de ejemplo"><button class="primary" type="submit">Añadir control</button><small class="muted">Citas ficticias guardadas en este navegador.</small></form></section>`;
}
function appointmentCard(item) {
  return `<article class="appointment-detail"><span class="time-badge">${escapeHtml(item.time)}</span><div><h3>${escapeHtml(item.title)}</h3><p>Elena Morales · ${escapeHtml(item.clinician)}</p><p class="muted">${escapeHtml(item.location)}</p>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}</div><button class="small-button danger" data-action="delete-appointment" data-id="${escapeHtml(item.id)}">Quitar</button></article>`;
}

function emojiPicker(field) {
  return `<details class="emoji-picker"><summary>😊 Emojis</summary><div class="emoji-grid">${emojis.map((emoji) => `<button type="button" data-action="insert-emoji" data-field="${field}" data-emoji="${emoji}" aria-label="Insertar ${emoji}">${emoji}</button>`).join('')}</div></details>`;
}
function chatComposer() {
  return `<form id="chat-form" class="chat-compose"><label for="chat-message">Tu mensaje</label><textarea id="chat-message" maxlength="600" required placeholder="Escribe a tu círculo…">${escapeHtml(chatDrafts[state.role] || '')}</textarea><div class="chat-tools">${emojiPicker('chat-message')}<button type="button" class="secondary" data-action="send-photo">🖼️ Foto</button><button type="button" class="secondary" data-action="send-audio">🎤 Audio</button></div><button class="primary" type="submit">Enviar mensaje</button><small class="muted">Foto y audio de ejemplo. No se usa cámara ni micrófono.</small></form>`;
}

function inquiriesPage() {
  if (state.role !== 'Cuidador') return accessDenied('Consultas disponibles para Cuidador.');
  return `${pageHeader('Marketplace', 'Consultas de familias', 'Bandeja de prueba para los perfiles del catálogo.')}${caregiverInboxSection()}`;
}
function inquiryStatus(caregiverId) {
  if (state.inquiryStatuses[caregiverId]) return state.inquiryStatuses[caregiverId];
  const messages = state.caregiverChats.filter((item) => item.caregiverId === caregiverId);
  return messages.some((item) => item.role === 'Cuidador') ? 'Respondida' : 'Pendiente';
}

function settingsPage() {
  const preferences = profilePreferences();
  return `${pageHeader('Preferencias', 'Configuración', 'Se guarda por perfil en este navegador.')}<section class="card settings-card"><h2>Apariencia</h2><div class="setting-options">${[['light','☀️ Claro'],['dark','🌙 Oscuro']].map(([value,label]) => `<button class="setting-choice ${preferences.theme === value ? 'selected' : ''}" data-action="set-theme" data-value="${value}" aria-pressed="${preferences.theme === value}">${label}</button>`).join('')}</div><h2>Tamaño de letra</h2><div class="setting-options">${[['standard','Normal'],['comfortable','Grande'],['large','Muy grande']].map(([value,label]) => `<button class="setting-choice ${preferences.size === value ? 'selected' : ''}" data-action="set-size" data-value="${value}" aria-pressed="${preferences.size === value}">${label}</button>`).join('')}</div><p class="muted">${state.role === 'Adulto mayor' ? 'Elena mantiene una letra base de 20 px o más.' : 'Puedes reducir la letra volviendo a Normal.'}</p><div class="reading-preview"><strong>Vista previa</strong><p>Tu próxima actividad aparece con una hora clara y un botón fácil de tocar.</p></div><button class="secondary" data-page="more">Volver a Más</button></section>`;
}
function aboutPage() {
  return `${pageHeader('AgeCare', 'Acerca de la app', 'El cuidado, en un mismo lugar.')}<section class="card about-card"><img src="assets/agecare-logo-oficial.jpeg" alt="AgeCare" class="about-logo"><p>AgeCare reúne a la familia, al cuidador, al médico y a la persona mayor para organizar el día y mantener el contacto.</p><p>Versión MVP · demostración local.</p><p class="muted">Datos ficticios. Sin emergencias reales, pagos ni sincronización entre dispositivos.</p><button class="secondary" data-page="more">Volver a Más</button></section>`;
}

function startMemoryGame() {
  const cards = ['🌻','☕','🐶','🍎','🌻','☕','🐶','🍎'];
  for (let index = cards.length - 1; index > 0; index--) { const other = Math.floor(Math.random() * (index + 1)); [cards[index], cards[other]] = [cards[other], cards[index]]; }
  memoryGame = { cards, open: [], matched: [], moves: 0, locked: false };
}
function memoryCard(index) {
  if (memoryGame.locked || memoryGame.matched.includes(index) || memoryGame.open.includes(index)) return;
  memoryGame.open.push(index);
  if (memoryGame.open.length === 2) {
    memoryGame.moves++;
    const [first, second] = memoryGame.open;
    if (memoryGame.cards[first] === memoryGame.cards[second]) { memoryGame.matched.push(first, second); memoryGame.open = []; }
    else { memoryGame.locked = true; const game = memoryGame; setTimeout(() => { if (memoryGame !== game) return; memoryGame.open = []; memoryGame.locked = false; if (currentRole === 'Adulto mayor' && state.page === 'entertainment') render('entertainment'); }, 1300); }
  }
  render('entertainment');
}
