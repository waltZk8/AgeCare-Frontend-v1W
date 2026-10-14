const STORAGE_KEY = 'agecare-mvp-state-v4';
const SESSION_KEY = 'agecare-mvp-session-v1';
const { mvpAccounts, authenticateMvp } = AgeCareMvpAuth;
const { months, emojis, calendarCells, validDate, formatDate } = AgeCareFeatures;
const THEME_KEY = 'agecare-device-theme-v1';
let CAREGIVER_ID = 'cg1';
let healthEdit = null;
const assistantMessages = [];
let editAppointmentId = null;
let pageHistory = [];
let chatFollowLatest = false;
const PREFERENCES_KEY = 'agecare-mvp-preferences-v1';
let calendarYear = 2026;
let calendarMonth = 9;
let selectedDate = '2026-10-09';
let marketQuery = '';
let marketSpecialty = '';
let selectedInquiry = null;
let memoryGame = { cards: [], open: [], matched: [], moves: 0, locked: false };
let triviaIndex = 0;
let triviaFeedback = '';
let healthTab = 'vitals';
let activeDocument = null;
let photoIndex = 0;
let galleryPresentation = false;
const reader = AgeCareAccessibility.createReader(window, (message) => {
  const status = document.querySelector('#reading-status');
  if (status) status.textContent = message;
  showToast(message);
});
const chatDrafts = {};
const leisure = AgeCareGames.create();
let fullscreenPhotoIndex = 0;

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
  photoReactions: [],
  healthEntries: initialHealthEntries(),
  appointments: AgeCareFeatures.appointments.map((item) => ({ ...item })),
  notifications: [
    { id: 'n1', audiences: ['Familia', 'Cuidador'], title: 'Medicamento sin confirmar', detail: 'Losartán 50 mg · 14:00 · prueba', level: 'attention', readBy: [] },
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
    ['today', '🏡', 'Inicio'], ['health', '❤️', 'Salud'], ['routine', '🗓️', 'Rutina'], ['chat', '💬', 'Familia'], ['marketplace', '🤝', 'Cuidadoras'], ['more', '⋯', 'Más'],
  ],
  Cuidador: [
    ['today', '🌤️', 'Turno'], ['medications', '💊', 'Medicinas'], ['routine', '🗓️', 'Rutina'], ['chat', '💬', 'Familia'], ['inquiries', '📨', 'Consultas'], ['more', '⋯', 'Más'],
  ],
  Médico: [
    ['today', '🩺', 'Resumen'], ['health', '❤️', 'Salud'], ['medications', '💊', 'Medicinas'], ['routine', '📅', 'Agenda'], ['chat', '💬', 'Equipo'], ['more', '⋯', 'Más'],
  ],
  'Adulto mayor': [
    ['today', '🏡', 'Inicio'], ['chat', '💬', 'Familia'], ['routine', '🗓️', 'Mi día'], ['entertainment', '😄', 'Diversión'], ['more', '⋯', 'Más'],
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
  '¿Qué le dice una pared a otra? Nos vemos en la esquina.',
  '¿Qué le dijo el cero al ocho? ¡Qué bonito cinturón!',
  '¿Cómo se queda un mago después de comer? Magordito.',
  '¿Cuál es la fruta que se ríe de todo? La naran-ja-ja-ja.',
  '¿Qué hace una computadora en el mar? Nada en la red.',
  '¿Qué le dijo el semáforo al coche? No me mires, me estoy cambiando.',
  '¿Por qué la escoba estaba contenta? Porque iba barriendo en la competencia.',
  '¿Qué le dijo una iguana a su hermana? Somos iguanitas.',
  '¿Cuál es el café más peligroso? El ex-preso.',
  '¿Qué animal tiene más dientes? El ratoncito Pérez.',
  '¿Por qué el pan fue al médico? Porque se sentía tostado.',
  '¿Qué dijo una uva cuando la pisaron? Nada, solo soltó un poquito de vino.',
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
  { id: 'cg4', name:'Marta Soto', age:45, experience:9, specialty:'Compañía y autonomía', availability:'Tardes · lunes a sábado', rating:'4,7', image:'assets/caregiver-marta.svg', bio:'Apoyo en compras, conversación y actividades cotidianas, respetando las preferencias de cada persona.' },
  { id: 'cg5', name:'Patricia León', age:39, experience:5, specialty:'Acompañamiento nocturno', availability:'Noches · turnos acordados', rating:'4,6', image:'assets/caregiver-patricia.svg', bio:'Compañía nocturna y coordinación con la familia para registrar novedades del descanso.' },
  { id: 'cg6', name:'Carmen Vidal', age:56, experience:15, specialty:'Vida diaria y movilidad', availability:'Jornada completa · días hábiles', rating:'4,9', image:'assets/caregiver-carmen.svg', bio:'Amplia experiencia en acompañamiento, higiene personal y organización de rutinas con el equipo.' },
  { id: 'cg7', name:'Daniela Fuentes', age:32, experience:3, specialty:'Actividades y compañía', availability:'Fines de semana', rating:'4,5', image:'assets/caregiver-daniela.svg', bio:'Paseos acompañados, lectura y actividades recreativas elegidas por la persona mayor.' },
  { id: 'cg3', name: 'Lucía Herrera', age: 52, experience: 12, specialty: 'Cuidados postoperatorios', availability: 'Media jornada', rating: '5,0', image: 'assets/caregiver-lucia.svg', bio: 'Experiencia en recuperación, movilidad segura y registro de observaciones.' },
];

const mvpDocuments = [
  { id: 'doc1', icon: '📄', title: 'Plan de cuidado', date: '8 de octubre de 2026', text: 'Elena recibe acompañamiento de Rosa durante el día. María coordina las actividades familiares. Las medicinas se consultan en el plan del perfil Médico. Documento ficticio de prueba.' },
  { id: 'doc2', icon: '📝', title: 'Resumen del control', date: '6 de octubre de 2026', text: 'Registro ficticio: conversar con el equipo sobre el descanso y los paseos acompañados. Próximo control de ejemplo: 9 de octubre, 16:00. No es una indicación médica.' },
];
function sectionIcon(icon) { return `<span class="section-icon" aria-hidden="true">${icon}</span>`; }
function routineIcon(type) { return ({ 'Cita médica': '🩺', 'Cuidado diario': '🥣', Bienestar: '🌿', Familia: '💛' })[type] || '🗓️'; }

// Compatibilidad con los datos de las versiones locales anteriores.
for (const [oldKey,newKey] of [['agecare-demo-state-v4',STORAGE_KEY],['agecare-demo-preferences-v1',PREFERENCES_KEY]]) {
  try { if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) localStorage.setItem(newKey,localStorage.getItem(oldKey)); } catch (_) {}
}
let state = loadState();
let currentRole = null;
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
    for (const field of ['routine', 'medications', 'chat', 'caregiverChats', 'notifications', 'appointments','healthEntries']) {
      if (!Array.isArray(loaded[field])) loaded[field] = defaults[field];
    }
    if (!loaded.inquiryStatuses || typeof loaded.inquiryStatuses !== 'object' || Array.isArray(loaded.inquiryStatuses)) loaded.inquiryStatuses = {};
    loaded.photoReactions = Array.isArray(loaded.photoReactions) ? [...new Set(loaded.photoReactions.filter((id) => id === 'garden-example' || loaded.chat.some((message) => message.id === id && message.type === 'photo')))] : [];
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

function deviceTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (['light','dark'].includes(saved)) return saved;
    const previous = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')?.[state.role]?.theme;
    const theme = ['light','dark'].includes(previous) ? previous : window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    return theme;
  } catch (_) { return 'light'; }
}
function profilePreferences() {
  let preferences = AgeCareFeatures.preferences();
  try { preferences = AgeCareFeatures.preferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')?.[state.role]); } catch (_) {}
  return { ...preferences, theme:deviceTheme() };
}
function applyPreferences() {
  const preferences = profilePreferences();
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.textSize = preferences.size;
  document.documentElement.dataset.contrast = String(preferences.contrast);
  document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'system';
  document.documentElement.dataset.spacing = String(preferences.spacing);
}
function setPreference(key, value) {
  if (!['theme','size','contrast','reducedMotion','spacing','defaults'].includes(key)) return;
  if (key === 'theme' && ['light','dark'].includes(value)) { try { localStorage.setItem(THEME_KEY, value); } catch (_) {} }
  let all = {};
  try { all = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}'); } catch (_) { /* valores predeterminados */ }
  if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
  all[state.role] = key === 'defaults' ? AgeCareFeatures.preferences() : AgeCareFeatures.preferences({ ...profilePreferences(), [key]: value });
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all)); } catch (_) { showToast('No se pudo guardar la configuración en este navegador.'); return; }
  const page = state.page === 'accessibility' ? 'accessibility' : 'settings';
  render(page);
  document.querySelector(`[data-pref="${key}"][data-value="${value}"]`)?.focus({ preventScroll: true });
}

function showLogin() {
  reader.stop(false);
  clearTimeout(toastTimer); document.querySelector('#toast').classList.add('hidden');
  document.querySelector('.skip-link')?.setAttribute('href', '#welcome-main');
  currentRole = null;
  try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* almacenamiento opcional */ }
  closeNotifications();
  app.classList.add('hidden');
  welcome.classList.remove('hidden');
  document.body.classList.remove('role-adult');
  document.documentElement.dataset.theme = deviceTheme();
  document.documentElement.dataset.textSize = 'standard';
  document.documentElement.dataset.contrast = 'false';
  document.documentElement.dataset.motion = 'system';
  document.documentElement.dataset.spacing = 'false';
  document.documentElement.dataset.role = 'guest';
  document.documentElement.dataset.page = 'welcome';
  loginForm.reset();
  loginError.classList.add('hidden');
  document.querySelector('#login-email').focus();
}

function enterMvp(role, caregiverId = 'cg1') {
  CAREGIVER_ID = caregivers.some(item=>item.id===caregiverId) ? caregiverId : 'cg1';
  const caregiver=caregivers.find(item=>item.id===CAREGIVER_ID);
  profiles.Cuidador={name:caregiver.name,description:'Cuidadora · consultas propias',initials:caregiver.name.split(' ').map(name=>name[0]).join('')};
  selectedInquiry=null; healthEdit=null; assistantMessages.length=0;
  healthTab = 'vitals';
  pageHistory = [];
  editAppointmentId = null;
  currentRole = role;
  state.role = role;
  state.page = 'today';
  state.editRoutineId = null;
  state.editMedicationId = null;
  loginError.classList.add('hidden');
  welcome.classList.add('hidden');
  app.classList.remove('hidden');
  render('today', { navigate:true });
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function id(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`; }
function canEditRoutine() { return ['Familia', 'Cuidador', 'Médico'].includes(state.role); }
function canEditMedication() { return ['Médico','Familia'].includes(state.role); }
function canEditHealth() { return ['Médico','Familia'].includes(state.role); }

function pageHeader(tag, title, subtitle) {
  const icons = { today: state.role === 'Médico' ? '🩺' : '🌤️', health: '❤️', routine: state.role === 'Médico' ? '📅' : '🗓️', calendar:'📅', medications: '💊', chat: '💬', marketplace: '🛍️', inquiries: '📨', entertainment: '🎈', photos: '🖼️', more: '✨', settings: '⚙️', accessibility: '♿', about: '💛' };
  return `<section class="page-head"><span class="page-symbol" aria-hidden="true">${icons[state.page] || '💛'}</span><div><span class="tag">${tag}</span><h1 tabindex="-1">${title}</h1><p>${subtitle}</p></div></section>`;
}

function patientStrip() {
  return `<div class="patient-strip"><div class="avatar">EM</div><div class="grow"><strong>Elena Morales</strong><small>78 años · perfil completamente ficticio</small></div><button data-action="patient-detail">Ver perfil</button></div>`;
}

function metric(label, value, detail) {
  const icons = { Ritmo: '❤️', Pulso: '❤️', 'SpO₂': '🫁', 'Oxígeno': '🫁', Sueño: '🌙', Actividad: '🚶', Medicinas: '💊', 'Presión arterial': '🩺', Temperatura: '🌡️' };
  const tone = ['Ritmo', 'Pulso', 'Presión arterial'].includes(label) ? 'coral' : ['Sueño', 'Temperatura'].includes(label) ? 'lavender' : label === 'Actividad' ? 'gold' : 'teal';
  return `<div class="soft metric-tile tone-${tone}">${sectionIcon(icons[label] || '📊')}<small>${label}</small><b>${value}</b><span class="muted">${detail}</span></div>`;
}

function familyDashboard() {
  const pending = state.medications.filter((item) => !item.taken).length;
  return `${pageHeader('Familia · móvil', 'Buenos días, María', 'Observa, coordina y acompaña a Elena.')}${patientStrip()}
    <section class="grid"><article class="card summary"><h3>${sectionIcon('💛')}Resumen de Elena</h3><div class="metric-cards">${metric('Ritmo', '72', 'lpm · simulado')}${metric('SpO₂', '96%', 'simulado')}${metric('Medicinas', `${pending} pend.`, 'hoy')}</div></article>
    <article class="card next-card"><span class="tag">Aviso ficticio</span><h2>Losartán sin confirmar</h2><p class="muted">14:00 · revisa con la cuidadora.</p><button class="primary" data-action="open-notifications">Ver notificaciones</button></article>
    <article class="card timeline"><h3>${sectionIcon('🗓️')}Próximas actividades</h3>${routinePreview()}</article>
    <article class="card notes"><h3>${sectionIcon('💬')}Círculo familiar</h3><p>Mensajes de familia, cuidadora, médico y Elena.</p><button class="secondary wide" data-page="chat">Abrir chat familiar</button></article>
    <article class="card contact-card"><h3>${sectionIcon('🤝')}Buscar cuidadora</h3><p class="muted">Marketplace ficticio exclusivo para la familia.</p><button class="primary wide" data-page="marketplace">Ver cuidadoras</button></article></section>`;
}

function caregiverDashboard() {
  if (CAREGIVER_ID !== 'cg1') return `${pageHeader('Mi espacio',escapeHtml(profiles.Cuidador.name),'Consultas y disponibilidad.')}<section class="card"><h2>Tu bandeja personal</h2><p>Revisa las consultas que las familias te han enviado.</p><button class="primary" data-page="inquiries">Abrir mis consultas</button></section>`;
  const next = state.medications.find((item) => !item.taken);
  return `${pageHeader('Cuidador · móvil', 'Turno de Rosa', 'Opera la rutina y registra el cuidado cotidiano.')}${patientStrip()}
    <section class="grid"><article class="card next-card"><span class="tag">Próxima medicina</span><h2>${next ? `${escapeHtml(next.name)} ${escapeHtml(next.dose)}` : 'Sin pendientes'}</h2><p class="muted">${next ? `${escapeHtml(next.time)} · ${escapeHtml(next.instructions)}` : 'La prueba está al día.'}</p>${next ? `<button class="primary" data-action="take-medication" data-id="${next.id}">Registrar administrada</button>` : ''}</article>
    <article class="card summary"><h3>${sectionIcon('🗓️')}Tareas del turno</h3>${routinePreview(true)}</article>
    <article class="card contact-card"><h3>${sectionIcon('✨')}Acciones rápidas</h3><div class="quick-grid"><button data-page="medications">💊<span>Medicinas</span></button><button data-page="routine">🗓️<span>Rutina</span></button><button data-page="chat">💬<span>Familia</span></button><button data-action="incident">⚠️<span>Incidente</span></button></div></article>
    <article class="card notes"><h3>${sectionIcon('📝')}Nota de relevo</h3><p class="muted">Registra observaciones en el chat del círculo.</p><button class="secondary wide" data-page="chat">Escribir observación</button></article></section>`;
}

function doctorDashboard() {
  const appointment = [...state.appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).find((item) => item.date >= '2026-10-08');
  return `${pageHeader('Médico · móvil', 'Panel clínico de Elena', 'Organización de salud con datos de prueba.')}${patientStrip()}
    <section class="grid"><article class="card summary"><h3>${sectionIcon('🩺')}Indicadores recientes</h3><div class="metric-cards">${metric('Ritmo', '72 lpm', 'registro de ejemplo')}${metric('SpO₂', '96%', 'registro de ejemplo')}${metric('Sueño', '6,2 h', 'noche anterior')}</div></article>
    <article class="card next-card"><span class="tag">Agenda</span><h2>${appointment ? escapeHtml(appointment.title) : 'Sin controles'}</h2><p class="muted">${appointment ? `${formatDate(appointment.date)} · ${escapeHtml(appointment.time)}` : 'Añade una cita desde Agenda.'}</p><button class="primary" data-page="routine">Organizar agenda</button></article>
    <article class="card timeline"><h3>${sectionIcon('📋')}Organización médica</h3><div class="list"><button class="item item-button" data-page="health"><span class="item-icon">♡</span><span class="grow"><strong>Historia de salud</strong><small>Tendencias y observaciones</small></span></button><button class="item item-button" data-page="medications"><span class="item-icon">✚</span><span class="grow"><strong>Plan de medicamentos</strong><small>Prescribir y ajustar horarios ficticios</small></span></button><button class="item item-button" data-page="chat"><span class="item-icon">◌</span><span class="grow"><strong>Equipo de cuidado</strong><small>Familia y cuidadora</small></span></button></div></article>
    <article class="card notes"><h3>Nota ética</h3><div class="notice">Los valores son sintéticos. No hay diagnóstico, receta ni expediente clínico real.</div></article></section>`;
}

function adultDashboard() {
  const next = [...state.routine].sort((a, b) => a.time.localeCompare(b.time)).find((item) => !item.done);
  return `${pageHeader('Adulto mayor · tablet', 'Hola, Elena 👋', 'Un espacio simple para sentirte acompañada.')}
    <section class="adult-grid"><article class="card adult-main"><h2>¿Cómo te sientes hoy?</h2><div class="mood-grid">${moodButton('Bien', '😀')}${moodButton('Regular', '😐')}${moodButton('Mal', '😟')}</div>${moodResponse()}</article>
    <article class="card next-card adult-next"><h3>${sectionIcon('⏰')}Lo próximo</h3><h2>${next ? escapeHtml(next.title) : 'Día completado'}</h2><p>${next ? `${escapeHtml(next.time)} · te acompañaremos` : 'Gracias por registrar tu día.'}</p></article>
    <button class="card adult-action" data-page="chat"><span>💬</span><strong>Mi familia</strong><small>Mensajes, fotos y audios</small></button>
    <button class="card adult-action" data-page="entertainment"><span>😄</span><strong>Diversión</strong><small>Chistes y juegos</small></button>
    <button class="card adult-action" data-page="routine"><span>🗓️</span><strong>Mi día</strong><small>Rutina en letras grandes</small></button><button class="card adult-action" data-page="photos"><span>🖼️</span><strong>Mis fotos</strong><small>Recuerdos del chat familiar</small></button></section>`;
}

function moodButton(label, emoji) {
  return `<button class="mood-button ${state.mood === label ? 'selected' : ''}" data-action="mood" data-mood="${label}" aria-pressed="${state.mood === label}"><span>${emoji}</span><strong>${label}</strong></button>`;
}

function moodResponse() {
  if (!state.mood) return '<p class="adult-help">Toca una carita. Tu respuesta se guarda solo en esta prueba.</p>';
  if (state.mood === 'Bien') return '<div class="support-card good"><strong>¡Qué bueno, Elena!</strong><p>Disfruta ese ánimo y comparte un saludo con tu familia.</p><button class="secondary" data-page="chat">Ir a mi familia</button></div>';
  return `<div class="support-card"><strong>Gracias por contarlo.</strong><p>${escapeHtml(state.moodSupport || 'Respira con calma, toma un poco de agua y habla con alguien de confianza.')}</p><p class="joke-inline">${escapeHtml(jokes[state.jokeIndex])}</p><div class="support-actions"><button class="primary" data-page="chat">Hablar con mi familia</button><button class="secondary" data-action="next-joke">Otro chiste</button></div><small>Se generó un aviso local para Familia y Cuidador.</small></div>`;
}

function routinePreview(actions = false) {
  return `<div class="list">${[...state.routine].sort((a,b) => a.time.localeCompare(b.time)).slice(0, 4).map((item) => `<div class="item routine-row ${item.done ? 'completed' : ''}"><span class="time-badge">${escapeHtml(item.time)}</span><div class="grow"><strong><span aria-hidden="true">${routineIcon(item.type)}</span> ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · ${item.done ? 'Completada ✓' : 'Pendiente'}</small></div>${actions && !item.done ? `<button class="small-button" data-action="complete-routine" data-id="${item.id}">Listo</button>` : ''}</div>`).join('')}</div>`;
}

function healthPage() {
  const doctor = state.role === 'Médico';
  const header = `${pageHeader('Expediente de ejemplo', 'Salud de Elena', doctor ? 'Mediciones, antecedentes y coordinación del equipo.' : 'Información clara para acompañar su día.')}${patientStrip()}<button class="secondary calendar-shortcut" data-page="calendar">📅 Calendario de controles</button>${healthNavigation()}`;
  if (healthTab === 'medicines') return header + healthMedicines() + healthEntryPanel();
  if (healthTab === 'log') return header + healthLog() + healthEntryPanel();
  if (healthTab === 'docs') return header + healthDocuments() + healthEntryPanel();
  return header + (doctor ? doctorHealthPage() : wearableStatus()) + healthEntryPanel();
}

function healthNavigation() {
  return `<nav class="section-switch" aria-label="Secciones de salud">${[['vitals','❤️ Mediciones'],['medicines','💊 Medicinas'],['log','📝 Bitácora'],['docs','📁 Documentos']].map(([key,label]) => `<button data-action="health-tab" data-tab="${key}" class="${healthTab === key ? 'selected' : ''}" aria-pressed="${healthTab === key}">${label}</button>`).join('')}</nav>`;
}
function wearableStatus() {
  return `<section class="card wearable-card"><div class="section-heading"><h2>${sectionIcon('⌚')}Pulsera de Elena</h2><span class="status-chip">Simulación</span></div><p>AgeCare Band · último registro: 8 oct. 2026, 09:40</p><div class="wearable-grid"><article><span>🔋 Batería</span><strong>64 %</strong><small>Autonomía de ejemplo: 2 días</small></article><article><span>❤️ Pulso en reposo</span><strong>72 lpm</strong><small>Últimas 24 h: 64–88 lpm</small></article><article><span>🫁 Oxígeno</span><strong>96 %</strong><small>Registro de las 09:40</small></article><article><span>🚶 Pasos</span><strong>2.340</strong><small>1,4 km estimados · 26 min activos</small></article><article><span>🌙 Descanso</span><strong>6 h 12 min</strong><small>22:45–06:10 · 3 interrupciones</small></article><article><span>📶 Señal de ejemplo</span><strong>Disponible</strong><small>Sin sincronización en tiempo real</small></article></div><details><summary>Ver origen y límites de los registros</summary><p>Valores ficticios cargados para este MVP. No hay un dispositivo conectado. La pulsera real puede tener errores de lectura: estos datos no confirman diagnósticos ni activan emergencias.</p><p>Última carga de ejemplo: 7 oct., 20:30. Movimiento registrado: 3 pausas activas. Registro de caídas: sin evento simulado. No hay GPS ni seguimiento real.</p></details></section>`;
}

function healthMedicines() {
  return `<section class="card"><h2>${sectionIcon('💊')}Plan del día</h2><div class="list">${state.medications.map(item => `<article class="item"><span class="item-icon" aria-hidden="true">${item.taken ? '✅' : '💊'}</span><div class="grow"><strong>${escapeHtml(item.name)} · ${escapeHtml(item.dose)}</strong><small>${escapeHtml(item.time)} · ${escapeHtml(item.instructions)}</small><small>${escapeHtml(item.reviewStatus || 'Registro ficticio')} · ${escapeHtml(item.updatedBy || 'Equipo de cuidado')}</small><span class="status-chip">${item.taken ? 'Administración registrada' : 'Sin confirmar'}</span></div></article>`).join('')}</div><p class="small-note">Confirmaciones ficticias. Familia y Médico editan los registros ficticios; el Cuidador registra la administración.</p>${canEditMedication() ? '<button class="primary" data-page="medications">Gestionar el plan</button>' : ''}</section>`;
}
function healthLog() {
  const followUp = `<section class="card"><h2>${sectionIcon('🩺')}Seguimiento y controles</h2><p class="muted">Agenda ficticia compartida del equipo.</p><div class="list">${state.appointments.slice().sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(item => `<article class="item"><span class="item-icon" aria-hidden="true">📅</span><div class="grow"><strong>${escapeHtml(item.title)}</strong><small>${formatDate(item.date)} · ${escapeHtml(item.time)}</small><p>${escapeHtml(item.clinician)} · ${escapeHtml(item.location)}</p></div></article>`).join('') || '<p>No hay controles programados.</p>'}</div><button class="secondary" data-page="calendar">Ver calendario completo</button></section><section class="card"><h2>${sectionIcon('✅')}Registro del cuidado diario</h2><div class="list">${state.routine.map(item => `<article class="item"><span class="time-badge">${escapeHtml(item.time)}</span><div class="grow"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · ${item.done ? 'Completada' : 'Pendiente'}</small></div></article>`).join('')}</div><p class="muted">${state.medications.filter(item => item.taken).length} de ${state.medications.length} administraciones de medicinas registradas.</p></section>`;
  return followUp;
}
function healthTeamNotes() {
  return `<section class="card"><h2>${sectionIcon('📝')}Lo que comparte el equipo</h2><div class="list"><article class="item"><span class="item-icon" aria-hidden="true">🥣</span><div class="grow"><strong>Buen apetito en el desayuno</strong><small>Rosa · 8 oct. 2026, 09:35 · nota de ejemplo</small><p>Elena desayunó bien. El paseo acompañado sigue en la rutina.</p></div></article><article class="item"><span class="item-icon" aria-hidden="true">😊</span><div class="grow"><strong>Ánimo: ${escapeHtml(state.mood || 'sin respuesta todavía')}</strong><small>Check-in de Elena en este navegador</small></div></article><article class="item"><span class="item-icon" aria-hidden="true">💬</span><div class="grow"><strong>Coordinación familiar</strong><small>Las observaciones nuevas se comparten en el chat.</small><button class="secondary" data-page="chat">Abrir conversación</button></div></article></div></section>`;
}
function healthDocuments() { return '<section class="card"><h2>📁 Documentos</h2><p>Fichas de texto del expediente ficticio. Familia y Médico pueden añadirlas y actualizarlas.</p></section>'; }

function routinePage() {
  if (state.role === 'Médico') return doctorAgendaPage();
  if (state.role === 'Adulto mayor') {
    return `${pageHeader('Mi día · tablet', 'Tu rutina, Elena', 'Una cosa a la vez, con horarios claros.')}<button class="secondary calendar-shortcut" data-page="calendar">📅 Mis controles</button><section class="adult-routine">${[...state.routine].sort((a,b) => a.time.localeCompare(b.time)).map((item) => `<article class="card adult-routine-item ${item.done ? 'done' : ''}"><span class="time-badge">${escapeHtml(item.time)}</span><div><strong><span aria-hidden="true">${routineIcon(item.type)}</span> ${escapeHtml(item.title)}</strong><small>${item.done ? 'Completada ✓' : escapeHtml(item.type)}</small></div></article>`).join('')}</section>`;
  }
  const editing = state.routine.find((item) => item.id === state.editRoutineId);
  return `${pageHeader('Agenda compartida', state.role === 'Médico' ? 'Agenda médica y rutina' : 'Rutina de Elena', 'Actividades y acompañamiento diario.')}<button class="secondary calendar-shortcut" data-page="calendar">📅 Calendario de controles</button>
    <section class="grid"><article class="card routine-card"><h3>${sectionIcon('🗓️')}Actividades</h3><div class="list">${[...state.routine].sort((a,b) => a.time.localeCompare(b.time)).map((item) => `<div class="item routine-row ${item.done ? 'completed' : ''}"><span class="time-badge">${escapeHtml(item.time)}</span><div class="grow"><strong><span aria-hidden="true">${routineIcon(item.type)}</span> ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)} · por ${escapeHtml(item.owner)}${item.done ? ' · Completada ✓' : ''}</small></div><div class="item-actions"><button class="small-button" data-action="edit-routine" data-id="${item.id}">Editar</button><button class="small-button danger" data-action="delete-routine" data-id="${item.id}">Quitar</button></div></div>`).join('')}</div></article>
    <article class="card progress-card"><h3>${editing ? 'Modificar actividad' : 'Añadir a la rutina'}</h3><form id="routine-form"><label for="routine-title">Actividad</label><input id="routine-title" required maxlength="80" value="${editing ? escapeHtml(editing.title) : ''}" placeholder="Ej.: Control médico"><label for="routine-time">Hora</label><input id="routine-time" type="time" required value="${editing ? escapeHtml(editing.time) : '12:00'}"><label for="routine-type">Tipo</label><select id="routine-type"><option ${editing?.type === 'Cita médica' ? 'selected' : ''}>Cita médica</option><option ${editing?.type === 'Cuidado diario' ? 'selected' : ''}>Cuidado diario</option><option ${editing?.type === 'Bienestar' ? 'selected' : ''}>Bienestar</option><option ${editing?.type === 'Familia' ? 'selected' : ''}>Familia</option></select><button class="primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir actividad'}</button>${editing ? '<button class="secondary" type="button" data-action="cancel-routine">Cancelar</button>' : ''}</form></article></section>`;
}

function medicationsPage() {
  const editing = state.medications.find((item) => item.id === state.editMedicationId);
  const list = `<div class="list">${state.medications.map((item) => `<div class="item medication-item"><span class="item-icon">${item.taken ? '✓' : '💊'}</span><div class="grow"><strong>${escapeHtml(item.name)} · ${escapeHtml(item.dose)}</strong><small>${escapeHtml(item.time)} · ${escapeHtml(item.instructions)} · ${item.taken ? 'registrada' : 'pendiente'}</small></div>${canEditMedication() ? `<div class="item-actions"><button class="small-button" data-action="edit-medication" data-id="${item.id}">Editar</button><button class="small-button danger" data-action="delete-medication" data-id="${item.id}">Quitar</button></div>` : ''}${state.role === 'Cuidador' && !item.taken ? `<button class="small-button" data-action="take-medication" data-id="${item.id}">Administrada</button>` : ''}</div>`).join('')}</div>`;
  return `${pageHeader('Plan ficticio', 'Medicamentos de Elena', canEditMedication() ? 'Familia y Médico organizan el plan de ejemplo.' : 'Registra las administraciones del día.')}<button class="secondary calendar-shortcut" data-page="calendar">📅 Calendario de controles</button>
    <section class="grid"><article class="card routine-card"><h3>${sectionIcon('💊')}Plan diario</h3>${list}<div class="notice">Los cambios son locales y no constituyen una prescripción.</div></article>
    ${canEditMedication() ? `<article class="card progress-card"><h3>${editing ? 'Modificar medicamento' : 'Añadir medicamento'}</h3><form id="medication-form"><label for="med-name">Nombre</label><input id="med-name" required maxlength="60" value="${editing ? escapeHtml(editing.name) : ''}" placeholder="Ej.: Vitamina D"><label for="med-dose">Dosis</label><input id="med-dose" required maxlength="30" value="${editing ? escapeHtml(editing.dose) : ''}" placeholder="Ej.: 1 comprimido"><label for="med-time">Hora</label><input id="med-time" type="time" required value="${editing ? escapeHtml(editing.time) : '12:00'}"><label for="med-instructions">Indicaciones</label><input id="med-instructions" maxlength="80" value="${editing ? escapeHtml(editing.instructions) : ''}" placeholder="Ej.: Con comida"><button class="primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir al plan'}</button>${editing ? '<button class="secondary" type="button" data-action="cancel-medication">Cancelar</button>' : ''}</form></article>` : ''}</section>`;
}

function chatPage() {
  const adult = state.role === 'Adulto mayor';
  return `${pageHeader('Círculo de Elena', adult ? 'Mi familia' : state.role === 'Médico' ? 'Equipo de cuidado' : 'Chat familiar', 'María, Rosa, Dr. Núñez y Elena.')}
    <section class="chat-layout"><article class="card chat-card">${readingControls()}<div class="chat-list">${state.chat.map(chatBubble).join('')}</div>${chatComposer()}</article>
    <aside class="card chat-info"><h3>Participantes</h3><div class="list"><div class="item"><span class="item-icon">MG</span><div class="grow"><strong>María</strong><small>Familia</small></div></div><div class="item"><span class="item-icon">RM</span><div class="grow"><strong>Rosa</strong><small>Cuidadora</small></div></div><div class="item"><span class="item-icon">FN</span><div class="grow"><strong>Dr. Núñez</strong><small>Médico</small></div></div><div class="item"><span class="item-icon">EM</span><div class="grow"><strong>Elena</strong><small>Adulto mayor</small></div></div></div><div class="notice">Texto y audios son simulados. No se usa micrófono ni se envía información.</div></aside></section>`;
}

function caregiverInboxSection() {
  const conversations = caregivers.filter(caregiver => caregiver.id === CAREGIVER_ID).map((caregiver) => ({
    caregiver,
    messages: state.caregiverChats.filter((message) => message.caregiverId === caregiver.id),
  })).filter(({ messages }) => messages.length);

  const selected = conversations.find(({ caregiver }) => caregiver.id === selectedInquiry);
  return `<section class="card caregiver-inbox"><h2>Mensajes de Familia</h2><div class="inquiry-list">${conversations.length ? conversations.map(({ caregiver, messages }) => `<button class="inquiry-summary ${selectedInquiry === caregiver.id ? 'selected' : ''}" data-action="open-inquiry" data-id="${caregiver.id}"><img src="${caregiver.image}" alt=""><span><strong>María González · familia de Elena</strong><small>${escapeHtml(messages.at(-1).text)}</small><span class="status-chip">${inquiryStatus(caregiver.id)}</span></span><span aria-hidden="true">›</span></button>`).join('') : '<div class="empty-state"><strong>Aún no hay consultas</strong><span>Las consultas del marketplace aparecerán aquí.</span></div>'}</div></section>
    ${selected ? `<section class="card caregiver-conversation"><div class="section-heading"><h2>María · familia de Elena</h2><span class="status-chip">${inquiryStatus(selected.caregiver.id)}</span></div><p class="muted">Consulta de María · perfil ficticio del catálogo</p><div class="chat-list">${selected.messages.map((message) => caregiverChatBubble(message, 'Cuidador')).join('')}</div><form class="caregiver-reply-form" data-caregiver-id="${selected.caregiver.id}"><label for="caregiver-reply-${selected.caregiver.id}">Respuesta para María</label><textarea id="caregiver-reply-${selected.caregiver.id}" name="message" maxlength="600" required placeholder="Escribe tu respuesta…"></textarea>${emojiPicker(`caregiver-reply-${selected.caregiver.id}`)}<button class="primary" type="submit">Enviar respuesta</button></form><div class="button-row"><button class="secondary" data-action="inquiry-status" data-id="${selected.caregiver.id}" data-status="Aceptada">Aceptar disponibilidad</button><button class="secondary danger" data-action="inquiry-status" data-id="${selected.caregiver.id}" data-status="Descartada">Descartar consulta</button></div><small class="muted">No genera contratos ni pagos.</small></section>` : ''}`;
}

function chatBubble(item) {
  const mine = item.role === state.role;
  return `<div class="chat-bubble ${mine ? 'mine' : ''}"><strong>${escapeHtml(item.author)} <small>${escapeHtml(item.role)}</small></strong>${item.type === 'audio' ? `<span class="media-caption">Audio de ejemplo · ${escapeHtml(item.duration)}</span><audio controls preload="none" src="assets/mvp-audio.wav" aria-label="Reproducir audio de ejemplo"></audio>` : item.type === 'photo' ? '<img class="chat-photo" width="600" height="400" src="assets/mvp-photo.svg" alt="Ilustración de un jardín con flores"><span class="media-caption">Foto de ejemplo</span>' : `<p>${escapeHtml(item.text)}</p><button class="read-message" data-action="read-message" data-id="${escapeHtml(item.id)}" aria-label="Escuchar mensaje de ${escapeHtml(item.author)}">🔊 Escuchar</button>`}<time>${escapeHtml(item.time)}</time></div>`;
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
    <div class="caregiver-catalog">
    ${selected ? `<section class="card marketplace-chat"><div class="section-heading"><h2>${escapeHtml(selected.name)}</h2><span class="status-chip">${inquiryStatus(selected.id)}</span></div><div class="chat-list">${state.caregiverChats.filter((item) => item.caregiverId === selected.id).map((item) => caregiverChatBubble(item, 'Familia')).join('')}</div><form id="caregiver-contact-form"><label for="caregiver-message">Tu consulta</label><textarea id="caregiver-message" maxlength="600" required placeholder="¿Qué apoyo necesita Elena?"></textarea>${emojiPicker('caregiver-message')}<button class="primary" type="submit">Enviar consulta</button><button class="secondary" type="button" data-action="close-caregiver">Volver al catálogo</button></form><small class="muted">Conversación local. Sin contratación real.</small></section>` : ''}
    <form id="marketplace-filter" class="card marketplace-filter"><label for="market-query">Nombre o especialidad</label><input id="market-query" type="search" maxlength="80" value="${escapeHtml(marketQuery)}" placeholder="Ej.: movilidad"><label for="market-specialty">Especialidad</label><select id="market-specialty"><option value="">Todas las especialidades</option>${caregivers.map((item) => `<option value="${item.id}" ${item.id === marketSpecialty ? 'selected' : ''}>${escapeHtml(item.specialty)}</option>`).join('')}</select><div class="button-row"><button class="primary" type="submit">Buscar</button><button class="secondary" type="button" data-action="clear-market-filters">Limpiar</button></div></form><p class="results-count">${results.length} perfiles de ejemplo</p>
    <section class="marketplace-grid">${results.length ? results.map((item) => `<article class="card caregiver-card"><div class="caregiver-card-header"><img src="${item.image}" alt="Retrato ilustrado de ${escapeHtml(item.name)}"><div><span class="tag">★ ${item.rating}</span><h2>${escapeHtml(item.name)}</h2><p>${item.age} años</p></div></div><div class="caregiver-body"><dl class="caregiver-details"><div><dt>Experiencia</dt><dd>${item.experience} años</dd></div><div><dt>Especialidad</dt><dd>${escapeHtml(item.specialty)}</dd></div><div><dt>Disponibilidad</dt><dd>${escapeHtml(item.availability)}</dd></div></dl><p>${escapeHtml(item.bio)}</p><button class="primary wide" data-action="contact-caregiver" data-id="${item.id}">${state.caregiverChats.some((message) => message.caregiverId === item.id) ? 'Ver conversación' : 'Enviar consulta'}</button>${state.caregiverChats.some((message) => message.caregiverId === item.id) ? `<span class="status-chip">${inquiryStatus(item.id)}</span>` : ''}</div></article>`).join('') : '<div class="card empty-state">No hay perfiles con esos filtros. Prueba otra búsqueda.</div>'}</section></div>`;
}

function entertainmentPage() {
  if (state.role !== 'Adulto mayor') return accessDenied('Diversión está adaptada para el perfil Adulto mayor.');
  if (!memoryGame.cards.length) startMemoryGame();
  const question = trivia[triviaIndex];
  return `${pageHeader('Tu tiempo libre', 'Disfruta un rato', 'Elige lo que te apetezca, sin prisa.')}
    ${readingControls()}<p class="muted">Juega a tu ritmo, sin reloj ni puntuaciones.</p>${leisure.html()}<section class="fun-grid"><article class="card joke-card"><span aria-hidden="true">😄</span><h2>${escapeHtml(jokes[state.jokeIndex % jokes.length])}</h2><div><button class="primary" data-action="next-joke">Otro chiste</button><button class="secondary" data-action="read-joke">🔊 Escuchar</button><button class="secondary" data-action="joke-helped">Me hizo reír</button></div></article>
    <article class="card memory-section"><h2>${sectionIcon('🧩')}Encuentra las parejas</h2><p>Toca dos tarjetas con el mismo dibujo.</p><div class="memory-grid">${memoryGame.cards.map((symbol, index) => { const visible = memoryGame.open.includes(index) || memoryGame.matched.includes(index); return `<button class="memory-card ${memoryGame.matched.includes(index) ? 'matched' : ''}" data-action="memory-card" data-index="${index}" ${memoryGame.matched.includes(index) || memoryGame.locked ? 'disabled' : ''} aria-label="Tarjeta ${index + 1}${visible ? `: ${symbol}` : ': oculta'}">${visible ? symbol : '❖'}</button>`; }).join('')}</div><p role="status">${memoryGame.matched.length === 8 ? '¡Encontraste todas las parejas!' : `${memoryGame.matched.length / 2} de 4 parejas · ${memoryGame.moves} intentos`}</p><button class="secondary" data-action="restart-memory">Nueva partida</button></article>
    <article class="card trivia-card"><h2>${sectionIcon('💡')}Una pregunta para jugar</h2><p>${question.question}</p><div class="trivia-answers">${question.answers.map((answer, index) => `<button class="secondary" data-action="trivia-answer" data-index="${index}">${answer}</button>`).join('')}</div><p class="trivia-feedback" role="status">${triviaFeedback}</p><button class="primary" data-action="next-trivia">Otra pregunta</button></article>
    <article class="card calm-card"><span>🌿</span><h2>${sectionIcon('🌿')}Pausa tranquila</h2><div class="breathing-circle" aria-hidden="true">Respira</div><p>Respira a tu ritmo. Puedes detenerte cuando quieras.</p><button class="secondary" data-page="chat">Compartir con mi familia</button></article></section>`;
}

function morePage() {
  return `${pageHeader('Tu espacio', 'Más', 'AgeCare a tu manera.')}<section class="more-menu"><button class="card menu-link" data-page="assistant"><span>✨</span><div><strong>Asistente AgeCare</strong><small>Orientación y resumen del MVP</small></div></button>${state.role !== 'Cuidador' || CAREGIVER_ID === 'cg1' ? `<button class="card menu-link" data-page="calendar"><span aria-hidden="true">📅</span><div><strong>Calendario de Elena</strong><small>Controles y seguimiento compartido</small></div><span aria-hidden="true">›</span></button><button class="card menu-link" data-page="health"><span aria-hidden="true">❤️</span><div><strong>Salud</strong><small>Mediciones, medicinas, bitácora y documentos</small></div><span aria-hidden="true">›</span></button>` : ''}<button class="card menu-link" data-page="accessibility"><span aria-hidden="true">♿</span><div><strong>Accesibilidad</strong><small>Letra, contraste, movimiento y lectura</small></div><span aria-hidden="true">›</span></button><button class="card menu-link" data-page="settings"><span aria-hidden="true">⚙️</span><div><strong>Configuración</strong><small>Modo claro u oscuro</small></div><span aria-hidden="true">›</span></button><button class="card menu-link" data-page="about"><span aria-hidden="true">💛</span><div><strong>Acerca de AgeCare</strong><small>Qué incluye esta versión</small></div><span aria-hidden="true">›</span></button>${state.role!=='Cuidador' || CAREGIVER_ID==='cg1' ? `<article class="card"><h2>${sectionIcon('🔄')}Datos de prueba</h2><p class="muted">Reinicia actividades, mensajes y controles. Tus preferencias se conservan.</p><button class="secondary danger wide" data-action="reset">Reiniciar prueba</button></article>` : ''}</section>`;
}

function accessDenied(message) {
  return `${pageHeader('Acceso por perfil', 'Sección no disponible', message)}<article class="card empty"><span class="item-icon">🔒</span><h3>Cambia al perfil correspondiente</h3><button class="primary" data-page="today">Volver al inicio</button></article>`;
}

const pages = { assistant: assistantPage, today: () => state.role === 'Familia' ? familyDashboard() : state.role === 'Cuidador' ? caregiverDashboard() : state.role === 'Médico' ? doctorDashboard() : adultDashboard(), health: healthPage, calendar: doctorAgendaPage, routine: routinePage, medications: medicationsPage, chat: chatPage, marketplace: marketplacePage, inquiries: inquiriesPage, entertainment: entertainmentPage, photos: photosPage, more: morePage, settings: settingsPage, accessibility: accessibilityPage, about: aboutPage };

function render(page = state.page, { navigate = false } = {}) {
  const previousPage = state.page;
  const oldChat = document.querySelector('.chat-list');
  const oldChatTop = oldChat?.scrollTop || 0;
  const oldChatBottom = oldChat ? oldChat.scrollHeight - oldChat.clientHeight - oldChat.scrollTop < 40 : true;
  const scrollTop = window.scrollY || 0;
  const focused = document.activeElement;
  const focusId = focused?.id;
  const focusAction = focused?.dataset?.action;
  const focusDate = focused?.dataset?.date;
  const selectionStart = focused?.selectionStart;
  const selectionEnd = focused?.selectionEnd;
  if (!currentRole) return;
  document.querySelector('.skip-link')?.setAttribute('href', '#content');
  state.role = currentRole;
  const allowed = (state.role !== 'Cuidador' || CAREGIVER_ID === 'cg1' || ['today','inquiries','more','settings','accessibility','about','assistant'].includes(page)) && (['settings', 'accessibility', 'about', 'calendar', 'health','medications','assistant'].includes(page) || (page === 'photos' && state.role === 'Adulto mayor') || navigation[state.role].some(([key]) => key === page));
  reader.stop(false);
  state.page = pages[page] && allowed ? page : 'today';
  if (previousPage !== state.page) pageHistory.push(previousPage);
  const openingPage = navigate || previousPage !== state.page;
  document.body.classList.toggle('role-adult', state.role === 'Adulto mayor');
  document.documentElement.dataset.page = state.page;
  document.documentElement.dataset.role = ({Familia:'family',Cuidador:'caregiver','Médico':'doctor','Adulto mayor':'elder'})[state.role];
  app.classList.toggle('wide-marketplace', state.page === 'marketplace');
  applyPreferences();
  const adultTools = state.role === 'Adulto mayor' ? `<nav class="adult-page-tools" aria-label="Navegación de Elena"><button class="secondary" data-page="more">⚙️ Más opciones</button></nav>` : '';
  const back = state.page !== 'today' ? '<button class="back-link secondary" data-action="go-back">‹ Volver</button>' : '';
  content.innerHTML = (back || adultTools ? `<div class="page-toolbar">${back}${adultTools}</div>` : '') + pages[state.page]();
  content.classList.toggle('page-enter', openingPage);
  const newChat = document.querySelector('.chat-list');
  if (newChat) newChat.scrollTop = chatFollowLatest || openingPage || oldChatBottom ? newChat.scrollHeight : oldChatTop;
  chatFollowLatest = false;
  updateProfile();
  updateNavigation();
  updateNotifications();
  saveState();
  if (navigate || previousPage !== state.page) window.scrollTo({ top: 0, behavior: 'auto' });
  else {
    window.scrollTo({ top: scrollTop, behavior: 'auto' });
    const replacement = focusId ? document.getElementById(focusId) : focusDate ? document.querySelector(`[data-action="${focusAction}"][data-date="${focusDate}"]`) : null;
    replacement?.focus({ preventScroll: true });
    if (typeof selectionStart === 'number') replacement?.setSelectionRange?.(selectionStart, selectionEnd);
  }
}

function updateProfile() {
  const profile = profiles[state.role];
  document.querySelector('#role-label').textContent = state.role;
  document.querySelector('#profile-name').textContent = profile.name;
  document.querySelector('#profile-description').textContent = profile.description;
  document.querySelector('#profile-avatar').textContent = profile.initials;
}

function updateNavigation() {
  const items = state.role === 'Cuidador' && CAREGIVER_ID !== 'cg1' ? [['today','🏡','Inicio'],['inquiries','📨','Consultas'],['more','⋯','Más']] : navigation[state.role];
  for (const navigationElement of [document.querySelector('#nav'), document.querySelector('#mobile-nav')]) {
    navigationElement.style.setProperty('--nav-count', items.length);
    navigationElement.innerHTML = items.map(([page, icon, label]) => { const active = page === state.page || (page === 'more' && ['settings', 'accessibility', 'about'].includes(state.page)); return `<button data-page="${page}" class="${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''} aria-label="${label}"><span aria-hidden="true">${icon}</span>${label}</button>`; }).join('');
  }
}

function visibleNotifications() {
  return state.notifications.filter(item => !(state.role === 'Cuidador' && CAREGIVER_ID !== 'cg1' && item.caregiverId !== CAREGIVER_ID) && item.audiences.includes(state.role) && (state.role !== 'Cuidador' || (item.caregiverId ? item.caregiverId === CAREGIVER_ID : item.title !== 'Nuevo mensaje de Familia' || item.detail.includes(profiles.Cuidador.name))));
}
function notificationDestination(item) {
  if (item.destination) return item.destination;
  const routes = { 'Nuevo mensaje del círculo':'chat', 'Foto del círculo':'chat', 'Audio del círculo':'chat', 'Nuevo mensaje de Familia':'inquiries', 'Respuesta de la cuidadora':'marketplace', 'Consulta actualizada':'marketplace', 'Control programado':'calendar', 'Nuevo control':'calendar', 'Control actualizado':'calendar', 'Rutina actualizada':'routine', 'Actividad completada':'routine' };
  return routes[item.title] || 'health';
}

function updateNotifications() {
  const items = visibleNotifications();
  const unread = items.filter((item) => !item.readBy.includes(state.role)).length;
  const count = document.querySelector('#notification-count');
  count.textContent = unread;
  count.classList.toggle('hidden', unread === 0);
  document.querySelector('#notification-list').innerHTML = items.length ? items.map((item) => `<button class="notification-item ${item.readBy.includes(state.role) ? 'read' : ''}" data-action="read-notification" data-id="${item.id}"><span class="notification-level ${item.level}"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join('') : '<div class="empty-state"><strong>Sin avisos para este perfil</strong><span>La prueba está al día.</span></div>';
}

function notify(audiences, title, detail, level = 'info', context = {}) { state.notifications.unshift({ id: id('n'), audiences, title, detail, level, readBy: [], ...context }); }
function openNotifications() { notificationPanel.classList.remove('hidden'); notificationButton.setAttribute('aria-expanded', 'true'); }
function closeNotifications() { notificationPanel.classList.add('hidden'); notificationButton.setAttribute('aria-expanded', 'false'); }
function showToast(message) { const toast = document.querySelector('#toast'); clearTimeout(toastTimer); toast.textContent = message; toast.classList.remove('hidden'); toastTimer = setTimeout(() => toast.classList.add('hidden'), 3400); }

function authorForRole() { return state.role === 'Familia' ? 'María' : state.role === 'Cuidador' ? profiles.Cuidador.name : state.role === 'Médico' ? 'Dr. Núñez' : 'Elena'; }

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const role = authenticateMvp(document.querySelector('#login-email').value, document.querySelector('#login-password').value);
  if (!role) {
    loginError.textContent = 'Correo o contraseña de prueba incorrectos.';
    loginError.classList.remove('hidden');
    document.querySelector('#login-password').focus();
    return;
  }
  const account=mvpAccounts[document.querySelector('#login-email').value.trim().toLowerCase()];
  enterMvp(role,account.caregiverId || 'cg1');
});
document.querySelectorAll('[data-mvp-role]').forEach((button) => button.addEventListener('click', () => {
  const account = Object.entries(mvpAccounts).find(([, details]) => details.role === button.dataset.mvpRole);
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
  if (state.role === 'Cuidador' && CAREGIVER_ID !== 'cg1' && !event.target.matches('.caregiver-reply-form') && event.target.id !== 'assistant-form') return;
  if (event.target.id === 'health-entry-form') { saveHealthEntry(); return; }
  if (event.target.id === 'assistant-form') { sendAssistant(); return; }
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
    const data = { updatedBy:authorForRole(), reviewStatus:state.role==='Familia'?'Pendiente de revisión del médico':'Registro del médico', name: document.querySelector('#med-name').value.trim(), dose: document.querySelector('#med-dose').value.trim(), time: document.querySelector('#med-time').value, instructions: document.querySelector('#med-instructions').value.trim() || 'Sin indicación' };
    if (!data.name || !data.dose || !data.time) return;
    const existing = state.medications.find((item) => item.id === state.editMedicationId);
    if (existing) Object.assign(existing, data); else state.medications.push({ id: id('m'), ...data, taken: false });
    notify(['Familia', 'Cuidador', 'Médico'], 'Plan de medicamentos actualizado', `${data.name} · ${data.dose} · ${data.time}`, 'attention');
    state.editMedicationId = null; showToast('Medicamento guardado solo en el MVP.'); render('medications');
  }
  if (event.target.id === 'chat-form') {
    const field = document.querySelector('#chat-message'); const text = field.value.trim(); if (!text) return;
    state.chat.push({ id: id('c'), author: authorForRole(), role: state.role, type: 'text', text, time: 'Ahora' });
    notify(Object.keys(profiles).filter((role) => role !== state.role), 'Nuevo mensaje del círculo', `${authorForRole()}: ${text}`, 'info');
    chatDrafts[state.role] = ''; showToast('Mensaje añadido al chat.'); chatFollowLatest = true; render('chat');
  }
  if (event.target.id === 'caregiver-contact-form') {
    if (state.role !== 'Familia') return;
    const field = document.querySelector('#caregiver-message'); const text = field.value.trim(); if (!text) return;
    const caregiver = caregivers.find((item) => item.id === state.contactCaregiverId);
    if (!caregiver) return;
    state.caregiverChats.push({ id: id('mc'), caregiverId: caregiver.id, author: authorForRole(), role: state.role, text, time: 'Ahora' });
    if (!['Aceptada', 'Descartada'].includes(state.inquiryStatuses[caregiver.id])) state.inquiryStatuses[caregiver.id] = 'Pendiente';
    notify(['Cuidador'], 'Nuevo mensaje de Familia', `María contactó a ${caregiver.name}.`, 'info', { caregiverId:caregiver.id, destination:'inquiries' });
    showToast(`Mensaje enviado a ${caregiver.name} en el MVP.`); render('marketplace');
  }
  if (event.target.matches('.caregiver-reply-form')) {
    if (state.role !== 'Cuidador') return;
    const caregiverId = event.target.dataset.caregiverId;
    const caregiver = caregivers.find((item) => item.id === caregiverId);
    const text = event.target.querySelector('textarea[name="message"]').value.trim();
    if (!caregiver || caregiverId !== CAREGIVER_ID || !text) return;
    state.caregiverChats.push({ id: id('mc'), caregiverId, author: caregiver.name, role: state.role, text, time: 'Ahora' });
    if (!['Aceptada', 'Descartada'].includes(state.inquiryStatuses[caregiverId])) state.inquiryStatuses[caregiverId] = 'Respondida';
    notify(['Familia'], 'Respuesta de la cuidadora', `${caregiver.name}: ${text}`, 'info', { destination:'marketplace', caregiverId });
    showToast(`Respuesta enviada a la familia desde ${caregiver.name}.`); render('inquiries');
  }
  if (event.target.id === 'marketplace-filter' && state.role === 'Familia') {
    marketQuery = document.querySelector('#market-query').value.trim();
    marketSpecialty = document.querySelector('#market-specialty').value;
    render('marketplace');
  }
  if (event.target.id === 'appointment-form' && canManageAppointments()) {
    const date = document.querySelector('#appointment-date').value;
    const time = document.querySelector('#appointment-time').value;
    const title = document.querySelector('#appointment-title').value.trim();
    if (!title || !validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { showToast('Revisa el nombre, la fecha y la hora.'); return; }
    if (state.appointments.some((item) => item.id !== editAppointmentId && item.date === date && item.time === time)) { showToast('Ya hay un control en esa fecha y hora.'); return; }
    const existing = state.appointments.find(item => item.id === editAppointmentId);
    const values = { date, time, title:title.slice(0,80), location:document.querySelector('#appointment-location').value.trim().slice(0,80) || 'Consulta de ejemplo' };
    if (existing) Object.assign(existing, values);
    else state.appointments.push({ id:id('a'), ...values, clinician:state.role === 'Médico' ? profiles[state.role].name : 'Equipo de cuidado', note:'' });
    editAppointmentId = null;
    [calendarYear, calendarMonth] = date.split('-').slice(0, 2).map(Number); calendarMonth--;
    selectedDate = date;
    notify(['Familia', 'Cuidador', 'Médico', 'Adulto mayor'].filter(role => role !== state.role), existing ? 'Control actualizado' : 'Nuevo control', `${title} · ${formatDate(date)} · ${time}`, 'info', { destination:'calendar', date });
    showToast(existing ? 'Control actualizado.' : 'Control añadido a la agenda.'); render('calendar');
  }
});

document.addEventListener('change', (event) => {
  if (!currentRole) return;
  if (event.target.id === 'calendar-month' || event.target.id === 'calendar-year') {
    const year = Number(document.querySelector('#calendar-year').value);
    const month = Number(document.querySelector('#calendar-month').value);
    if (!calendarCells(year, month).length) { showToast('Elige un año entre 1900 y 2100.'); return; }
    calendarYear = year; calendarMonth = month;
    selectedDate = `${year}-${String(month + 1).padStart(2,'0')}-01`;
    render(state.page);
  }
});
document.addEventListener('input', (event) => {
  if (currentRole && event.target.id === 'chat-message') chatDrafts[state.role] = event.target.value;
});

document.addEventListener('click', (event) => {
  if (!currentRole) return;
  const pageTarget = event.target.closest('button[data-page], a[data-page]');
  if (pageTarget) { render(pageTarget.dataset.page, { navigate: true }); document.querySelector('.page-head h1')?.focus({ preventScroll: true }); return; }
  const target = event.target.closest('[data-action]'); if (!target) return;
  const action = target.dataset.action;
  if (state.role === 'Cuidador' && CAREGIVER_ID !== 'cg1' && !['go-back','open-inquiry','inquiry-status','insert-emoji','set-preference','reset-preferences','read-sample','stop-reading','open-notifications','close-notifications','read-all','read-notification','assistant-prompt'].includes(action)) return;
  if (action === 'assistant-prompt') { sendAssistant(target.dataset.prompt); return; }
  if (['health-edit','health-cancel','health-delete'].includes(action)) {
    if (!canEditHealth()) return;
    if (action === 'health-edit') healthEdit = state.healthEntries.find(item=>item.id===target.dataset.id)?.id || null;
    if (action === 'health-cancel') healthEdit=null;
    if (action === 'health-delete') { state.healthEntries=state.healthEntries.filter(item=>item.id!==target.dataset.id); healthEdit=null; }
    render('health'); if(action==='health-edit') document.querySelector('#health-entry-form')?.scrollIntoView({block:'center'}); return;
  }
  if (action.startsWith('game-')) { if (state.role === 'Adulto mayor' && !suppressPuzzleClick) { leisure.act(action, target.dataset); render('entertainment'); } return; }
  if (action === 'photo-fullscreen' && state.role === 'Adulto mayor') { fullscreenPhotoIndex = Math.max(0,galleryPhotos().findIndex(item => item.id === target.dataset.id)); openPhotoViewer(); return; }
  if (action === 'viewer-close') { document.querySelector('#photo-viewer').close(); return; }
  if (action === 'viewer-prev' || action === 'viewer-next') { fullscreenPhotoIndex = Math.max(0,Math.min(galleryPhotos().length-1,fullscreenPhotoIndex+(action==='viewer-next'?1:-1))); updatePhotoViewer(); return; }
  if (action === 'go-back') { const destination = pageHistory.pop() || 'today'; render(destination, { navigate:true }); pageHistory.pop(); return; }
  if (['edit-medication', 'delete-medication', 'cancel-medication'].includes(action) && !canEditMedication()) return;
  if (['edit-routine', 'delete-routine', 'cancel-routine'].includes(action) && !['Familia', 'Cuidador'].includes(state.role)) return;
  if (action === 'take-medication' && state.role !== 'Cuidador') return;
  if (action === 'complete-routine' && !['Familia', 'Cuidador'].includes(state.role)) return;
  if (['mood','joke-helped','next-joke','memory-card','restart-memory','trivia-answer','next-trivia'].includes(action) && state.role !== 'Adulto mayor') return;
  if (['contact-caregiver', 'close-caregiver', 'clear-market-filters'].includes(action) && state.role !== 'Familia') return;
  if (['open-inquiry','inquiry-status'].includes(action) && state.role !== 'Cuidador') return;
  if (['delete-appointment','edit-appointment','cancel-appointment'].includes(action) && !canManageAppointments()) return;
  if (['gallery-mode','photo-prev','photo-next','photo-heart','read-joke'].includes(action) && state.role !== 'Adulto mayor') return;
  if (action === 'set-preference') {
    const key = target.dataset.pref;
    const value = ['contrast','reducedMotion','spacing'].includes(key) ? target.dataset.value === 'true' : target.dataset.value;
    setPreference(key, value); return;
  }
  if (action === 'reset-preferences') { setPreference('defaults'); showToast('Preferencias de este perfil restablecidas.'); return; }
  if (action === 'read-message') {
    const message = state.chat.find(item => item.id === target.dataset.id && item.type === 'text');
    if (message) reader.read(`${message.author} dice: ${message.text}`);
    return;
  }
  if (action === 'read-joke') { reader.read(jokes[state.jokeIndex % jokes.length]); return; }
  if (action === 'read-sample') { reader.read('Hola. Bienvenida a AgeCare. Tu próxima actividad es un paseo acompañado a las diez y media.'); return; }
  if (action === 'stop-reading') { reader.stop(); return; }
  if (action === 'health-tab') {
    if (['vitals','medicines','log','docs'].includes(target.dataset.tab)) { healthTab = target.dataset.tab; healthEdit=null; activeDocument = null; render('health'); document.querySelector(`[data-action="health-tab"][data-tab="${healthTab}"]`)?.focus({ preventScroll: true }); }
    return;
  }
  if (action === 'open-document') { if (mvpDocuments.some(item => item.id === target.dataset.id)) activeDocument = target.dataset.id; render('health'); return; }
  if (action === 'close-document') { activeDocument = null; render('health'); return; }

  if (action === 'gallery-mode') { galleryPresentation = !galleryPresentation; photoIndex = 0; render('photos'); return; }
  if (action === 'photo-prev' || action === 'photo-next') { photoIndex = Math.max(0, Math.min(galleryPhotos().length - 1, photoIndex + (action === 'photo-next' ? 1 : -1))); render('photos'); return; }
  if (action === 'photo-heart') {
    if (!galleryPhotos().some(item => item.id === target.dataset.id)) return;
    const photoId = target.dataset.id;
    state.photoReactions = state.photoReactions.includes(photoId) ? state.photoReactions.filter(id => id !== photoId) : [...state.photoReactions, photoId];
    render('photos'); Array.from(document.querySelectorAll('[data-action="photo-heart"]')).find(button => button.dataset.id === photoId)?.focus(); return;
  }
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
    field.focus({ preventScroll: true }); return;
  }
  if (action === 'open-inquiry' && target.dataset.id !== CAREGIVER_ID) return;
  if (action === 'inquiry-status' && target.dataset.id !== CAREGIVER_ID) return;
  if (action === 'open-inquiry') { selectedInquiry = target.dataset.id; render('inquiries'); return; }
  if (action === 'inquiry-status') {
    const caregiver = caregivers.find((item) => item.id === target.dataset.id);
    if (!caregiver || !state.caregiverChats.some((item) => item.caregiverId === caregiver.id) || !['Aceptada','Descartada'].includes(target.dataset.status)) return;
    state.inquiryStatuses[caregiver.id] = target.dataset.status;
    notify(['Familia'], 'Consulta actualizada', `${caregiver.name} · ${target.dataset.status}`, 'info', { destination:'marketplace', caregiverId:caregiver.id }); render('inquiries'); return;
  }
  if (action === 'clear-market-filters') { marketQuery = ''; marketSpecialty = ''; render('marketplace'); return; }
  if (action === 'edit-appointment') { editAppointmentId = state.appointments.some(item=>item.id===target.dataset.id) ? target.dataset.id : null; render(state.page); document.querySelector('#appointment-form')?.scrollIntoView({ block:'center', behavior:'auto' }); return; }
  if (action === 'cancel-appointment') { editAppointmentId = null; render(state.page); return; }
  if (action === 'calendar-day' && validDate(target.dataset.date)) { selectedDate = target.dataset.date; render(state.page); return; }
  if (action === 'calendar-prev' || action === 'calendar-next') {
    const date = new Date(calendarYear, calendarMonth + (action === 'calendar-next' ? 1 : -1), 1);
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return;
    calendarYear = date.getFullYear(); calendarMonth = date.getMonth(); selectedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2,'0')}-01`; render(state.page); return;
  }
  if (action === 'delete-appointment') { editAppointmentId=null; state.appointments = state.appointments.filter((item) => item.id !== target.dataset.id); render(state.page); return; }
  if (action === 'memory-card') { const index = Number(target.dataset.index); if (Number.isInteger(index) && index >= 0 && index < 8) memoryCard(index); return; }
  if (action === 'restart-memory') { startMemoryGame(); render('entertainment'); return; }
  if (action === 'trivia-answer') { triviaFeedback = Number(target.dataset.index) === trivia[triviaIndex].correct ? '¡Correcto! 😊' : 'Prueba otra opción; no hay prisa.'; render('entertainment'); return; }
  if (action === 'next-trivia') { triviaIndex = (triviaIndex + 1) % trivia.length; triviaFeedback = ''; render('entertainment'); return; }
  if (action === 'open-notifications') openNotifications();
  if (action === 'close-notifications') closeNotifications();
  if (action === 'read-all') { visibleNotifications().forEach((item) => { if (!item.readBy.includes(state.role)) item.readBy.push(state.role); }); showToast('Avisos leídos para este perfil.'); updateNotifications(); saveState(); }
  if (action === 'read-notification') {
    const item = visibleNotifications().find(notice => notice.id === target.dataset.id);
    if (!item) return;
    if (!item.readBy.includes(state.role)) item.readBy.push(state.role);
    const destination = notificationDestination(item);
    if (destination === 'health') healthTab = item.healthTab || (/medicamento/i.test(item.title) ? 'medicines' : 'log');
    if (destination === 'inquiries') selectedInquiry = CAREGIVER_ID;
    if (destination === 'marketplace' && item.caregiverId) state.contactCaregiverId = item.caregiverId;
    if (destination === 'calendar' && validDate(item.date)) { selectedDate = item.date; calendarYear = Number(item.date.slice(0,4)); calendarMonth = Number(item.date.slice(5,7))-1; }
    closeNotifications(); render(destination, { navigate:true }); return;
  }
  if (action === 'patient-detail') showToast('Elena Morales · perfil ficticio · sin evaluación clínica real.');
  if (action === 'incident') showToast('Incidentes reales siguen deshabilitados hasta contar con entrega y acuse confiables.');
  if (action === 'complete-routine') { const item = state.routine.find((entry) => entry.id === target.dataset.id); if (item) item.done = true; notify(['Familia', 'Cuidador'], 'Actividad completada', `${item?.title || 'Actividad'} · prueba`, 'success'); showToast('Actividad registrada.'); render(); }
  if (action === 'edit-routine') { state.editRoutineId = target.dataset.id; render('routine'); }
  if (action === 'cancel-routine') { state.editRoutineId = null; render('routine'); }
  if (action === 'delete-routine') { state.routine = state.routine.filter((item) => item.id !== target.dataset.id); showToast('Actividad retirada de el MVP.'); render('routine'); }
  if (action === 'edit-medication') { state.editMedicationId = target.dataset.id; render('medications'); }
  if (action === 'cancel-medication') { state.editMedicationId = null; render('medications'); }
  if (action === 'delete-medication') { state.medications = state.medications.filter((item) => item.id !== target.dataset.id); notify(['Familia', 'Cuidador', 'Médico'], 'Plan de medicamentos modificado', 'Se retiró un medicamento de la prueba.', 'attention'); showToast('Medicamento retirado de el MVP.'); render('medications'); }
  if (action === 'take-medication') { const item = state.medications.find((entry) => entry.id === target.dataset.id); if (item) item.taken = true; notify(['Familia', 'Cuidador'], 'Medicamento registrado', `${item?.name || 'Medicamento'} · administrado en el MVP`, 'success'); showToast('Administración ficticia registrada.'); render(); }
  if (action === 'mood') {
    state.mood = target.dataset.mood;
    if (state.mood !== 'Bien') {
      state.moodSupport = state.mood === 'Mal' ? 'No estás sola. Si te sientes mal físicamente, habla con tu cuidadora o familia.' : 'Tómate un momento tranquilo y cuéntale a tu familia cómo estás.';
      notify(['Familia', 'Cuidador'], 'Estado de ánimo de Elena', `Elena indicó “${state.mood}”. Conviene acompañarla.`, 'attention');
      showToast('Familia y Cuidador recibieron un aviso local.');
    } else { state.moodSupport = null; notify(['Familia', 'Cuidador'], 'Check-in positivo', 'Elena indicó que se siente bien.', 'success'); showToast('Ánimo registrado en la prueba.'); }
    render('today');
  }
  if (action === 'next-joke') { state.jokeIndex = (state.jokeIndex + 1) % jokes.length; render(state.page); }
  if (action === 'joke-helped') { state.mood = 'Bien'; state.moodSupport = null; notify(['Familia', 'Cuidador'], 'El ánimo mejoró', 'Elena indicó que el chiste le hizo reír.', 'success'); showToast('¡Qué bueno! Se avisó localmente al círculo.'); render('entertainment'); }
  if (action === 'send-audio' || action === 'send-photo') {
    const type = action === 'send-photo' ? 'photo' : 'audio';
    state.chat.push({ id: id('c'), author: authorForRole(), role: state.role, type, duration: '0:03', text: type === 'photo' ? 'Foto de ejemplo' : 'Audio de ejemplo', time: 'Ahora' });
    notify(Object.keys(profiles).filter((role) => role !== state.role), type === 'photo' ? 'Foto del círculo' : 'Audio del círculo', `${authorForRole()} envió un ejemplo.`, 'info');
    showToast(type === 'photo' ? 'Foto de ejemplo añadida.' : 'Audio de ejemplo añadido.'); chatFollowLatest = true; render('chat');
  }
  if (action === 'play-audio') showToast('Reproducción simulada: no se accedió al micrófono ni a archivos externos.');
  if (action === 'contact-caregiver') { state.contactCaregiverId = target.dataset.id; render('marketplace'); setTimeout(() => document.querySelector('.marketplace-chat')?.scrollIntoView({ behavior: 'auto' }), 0); }
  if (action === 'close-caregiver') { state.contactCaregiverId = null; render('marketplace'); }
  if (action === 'reset') { state = initialState(); Object.keys(chatDrafts).forEach((role) => delete chatDrafts[role]); selectedInquiry = null; marketQuery = ''; marketSpecialty = ''; startMemoryGame(); closeNotifications(); showToast('Mvpstración reiniciada.'); render('today'); }
});

window.addEventListener('online', () => showToast('Conexión disponible. La mvp continúa local.'));
window.addEventListener('offline', () => showToast('Sin conexión. El estado local se conserva.'));
showLogin(); // Elegir una cuenta en cada apertura; conservar solamente los datos de prueba.
updateProfile(); updateNavigation(); updateNotifications();

function doctorHealthPage() {
  const history=state.healthEntries.find(item=>item.id==='doc3');
  return wearableStatus()+`<section class="card"><h2>${sectionIcon('📋')}Antecedentes y apoyo</h2><p class="clinical-note">${escapeHtml(history?.note || 'Sin ficha de antecedentes. Puedes añadirla en Documentos.')}</p><button class="secondary" data-action="health-tab" data-tab="docs">Revisar y editar documentos</button><p>${state.medications.filter(item=>item.taken).length} de ${state.medications.length} administraciones registradas. Ánimo: ${escapeHtml(state.mood || 'sin respuesta')}.</p></section>`;
}

function canManageAppointments() { return ['Médico','Cuidador','Familia'].includes(state.role); }
function doctorAgendaPage() {
  const editing = state.appointments.find(item => item.id === editAppointmentId);
  const events = state.appointments.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const monthEvents = state.appointments.filter((item) => item.date.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return `${pageHeader('Agenda de Elena', 'Controles médicos', 'Selecciona un día para revisar sus citas.')}
    <section class="card calendar-card"><div class="calendar-controls"><button class="secondary" data-action="calendar-prev" aria-label="Mes anterior">‹</button><label>Mes<select id="calendar-month">${months.map((month, index) => `<option value="${index}" ${index === calendarMonth ? 'selected' : ''}>${month}</option>`).join('')}</select></label><label>Año<input id="calendar-year" type="number" min="1900" max="2100" value="${calendarYear}"></label><button class="secondary" data-action="calendar-next" aria-label="Mes siguiente">›</button></div>
    <h2>${sectionIcon('📅')}${months[calendarMonth]} de ${calendarYear}</h2><div class="calendar-week" aria-hidden="true">${['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map((day) => `<span>${day}</span>`).join('')}</div><div class="calendar-grid" aria-label="Días de ${months[calendarMonth]}">${calendarCells(calendarYear, calendarMonth).map((date) => { if (!date) return '<span class="calendar-empty"></span>'; const count = state.appointments.filter((item) => item.date === date).length; return `<button class="calendar-day ${date === selectedDate ? 'selected' : ''} ${count ? 'has-appointment' : ''}" data-action="calendar-day" data-date="${date}" aria-pressed="${date === selectedDate}" aria-label="${formatDate(date)}${count ? `, ${count} control${count > 1 ? 'es' : ''}` : ', sin controles'}"><span>${Number(date.slice(-2))}</span>${count ? '<i aria-hidden="true"></i>' : ''}</button>`; }).join('')}</div><p class="calendar-legend"><span></span> Día con control</p></section>
    <section class="card selected-appointments" aria-live="polite"><h2>${formatDate(selectedDate)}</h2>${events.length ? events.map(appointmentCard).join('') : '<p class="muted">Sin controles para este día.</p>'}</section>
    <section class="card"><h2>${sectionIcon('📅')}Controles del mes</h2>${monthEvents.length ? monthEvents.map((item) => `<button class="appointment-summary" data-action="calendar-day" data-date="${item.date}"><span class="time-badge">${item.date.slice(-2)} ${months[calendarMonth].slice(0,3).toLowerCase()}</span><span><strong>${escapeHtml(item.title)}</strong><small>Elena Morales · ${escapeHtml(item.time)}</small></span></button>`).join('') : '<p class="muted">Este mes no tiene controles.</p>'}</section>
    ${canManageAppointments() ? `<section class="card"><h2>${sectionIcon('🗓️')}${editing ? 'Modificar control' : 'Programar un control'}</h2><form id="appointment-form"><label for="appointment-title">Control</label><input id="appointment-title" value="${escapeHtml(editing?.title || '')}" required maxlength="80" placeholder="Ej.: Control general"><div class="form-pair"><div><label for="appointment-date">Fecha</label><input id="appointment-date" type="date" min="1900-01-01" max="2100-12-31" value="${editing?.date || selectedDate}" required></div><div><label for="appointment-time">Hora</label><input id="appointment-time" type="time" value="${editing?.time || '10:00'}" required></div></div><label for="appointment-location">Lugar</label><input id="appointment-location" value="${escapeHtml(editing?.location || '')}" maxlength="80" placeholder="Consulta de ejemplo"><button class="primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir control'}</button>${editing ? '<button type="button" class="secondary" data-action="cancel-appointment">Cancelar edición</button>' : ''}<small class="muted">Citas ficticias guardadas en este navegador.</small></form></section>` : '<p class="muted">Agenda compartida de ejemplo. El equipo de cuidado coordina los controles.</p>'}`;
}
function appointmentCard(item) {
  return `<article class="appointment-detail"><span class="time-badge">${escapeHtml(item.time)}</span><div><h3>${escapeHtml(item.title)}</h3><p>Elena Morales · ${escapeHtml(item.clinician)}</p><p class="muted">${escapeHtml(item.location)}</p>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}</div>${canManageAppointments() ? `<button class="small-button" data-action="edit-appointment" data-id="${escapeHtml(item.id)}">Modificar</button><button class="small-button danger" data-action="delete-appointment" data-id="${escapeHtml(item.id)}">Quitar</button>` : ''}</article>`;
}

function emojiPicker(field) {
  return `<details class="emoji-picker"><summary>😊 Emojis</summary><div class="emoji-grid">${emojis.map((emoji) => `<button type="button" data-action="insert-emoji" data-field="${field}" data-emoji="${emoji}" aria-label="Insertar ${emoji}">${emoji}</button>`).join('')}</div></details>`;
}
function chatComposer() {
  return `<form id="chat-form" class="chat-compose"><label for="chat-message">Tu mensaje</label><textarea id="chat-message" maxlength="600" required placeholder="Escribe a tu círculo…">${escapeHtml(chatDrafts[state.role] || '')}</textarea><div class="chat-tools">${emojiPicker('chat-message')}<button type="button" class="secondary" data-action="send-photo">🖼️ Foto</button><button type="button" class="secondary" data-action="send-audio">🎤 Audio</button></div><button class="primary" type="submit">Enviar mensaje</button><small class="muted">Foto y audio de ejemplo. No se usa cámara ni micrófono.</small></form>`;
}

function inquiriesPage() {
  if (state.role !== 'Cuidador') return accessDenied('Consultas disponibles para Cuidador.');
  return `${pageHeader('Marketplace', 'Consultas de familias', `Consultas dirigidas a ${profiles.Cuidador.name}.`)}${caregiverInboxSection()}`;
}
function inquiryStatus(caregiverId) {
  if (state.inquiryStatuses[caregiverId]) return state.inquiryStatuses[caregiverId];
  const messages = state.caregiverChats.filter((item) => item.caregiverId === caregiverId);
  return messages.some((item) => item.role === 'Cuidador') ? 'Respondida' : 'Pendiente';
}

function settingsPage() {
  const preferences = profilePreferences();
  return `${pageHeader('A tu manera', 'Configuración', 'El tema se mantiene al cambiar de perfil.')}<section class="card settings-card"><h2>${sectionIcon('🎨')}Apariencia</h2>${preferenceChoices('theme', [['light','☀️ Claro'],['dark','🌙 Oscuro']], preferences)}<p>Adapta el tamaño y la lectura en Accesibilidad.</p><button class="primary" data-page="accessibility">♿ Abrir accesibilidad</button><button class="secondary" data-page="more">Volver a Más</button></section>`;
}
function preferenceChoices(key, options, preferences) {
  return `<div class="setting-options">${options.map(([value,label]) => `<button class="setting-choice ${preferences[key] === value ? 'selected' : ''}" data-action="set-preference" data-pref="${key}" data-value="${value}" aria-pressed="${preferences[key] === value}">${label}</button>`).join('')}</div>`;
}
function accessibilityPage() {
  const preferences = profilePreferences();
  return `${pageHeader('Preferencias por perfil', 'Accesibilidad', 'Ajusta AgeCare para leer y moverte con comodidad.')}<section class="accessibility-grid"><article class="card"><h2>${sectionIcon('🔠')}Tamaño de letra</h2>${preferenceChoices('size', [['standard','100 %'],['comfortable','125 %'],['large','150 %'],['extra','200 %']], preferences)}<p class="muted">Elige el tamaño que te resulte más cómodo.</p><div class="reading-preview"><strong>Tu día, con calma</strong><p>🗓️ Paseo acompañado</p><span class="time-badge">10:30</span><p>Rosa te acompaña en el jardín.</p></div></article><article class="card"><h2>${sectionIcon('👁️')}Contraste y lectura</h2><h3>Alto contraste</h3>${preferenceChoices('contrast', [[false,'Normal'],[true,'Alto contraste']], preferences)}<h3>Espaciado del texto</h3>${preferenceChoices('spacing', [[false,'Habitual'],[true,'Más espacio']], preferences)}<h3>Movimiento</h3>${preferenceChoices('reducedMotion', [[false,'Seguir dispositivo'],[true,'Reducir movimiento']], preferences)}<p class="muted">Siempre se respeta la preferencia de movimiento reducido del dispositivo.</p></article><article class="card"><h2>${sectionIcon('🔊')}Escuchar el contenido</h2><p>Escucha mensajes y chistes con una voz local en español, si tu dispositivo tiene una disponible.</p><div class="button-row"><button class="primary" data-action="read-sample">🔊 Probar lectura</button><button class="secondary" data-action="stop-reading">⏹️ Detener</button></div><p id="reading-status" class="reading-status" role="status">La lectura empieza cuando pulses Escuchar.</p></article><article class="card"><h2>${sectionIcon('👆')}A tu ritmo</h2><p>Toca los botones para explorar. Puedes volver cuando quieras y ajustar estas opciones en cualquier momento.</p><button class="secondary" data-action="reset-preferences">Restablecer mis preferencias</button><button class="secondary" data-page="more">Volver a Más</button></article></section>`;
}
function readingControls() {
  return `<div class="reading-toolbar"><span>🔊 Lectura en voz alta</span><button class="secondary" data-action="stop-reading">Detener lectura</button></div><p id="reading-status" class="reading-status" role="status"></p>`;
}
function galleryPhotos() {
  return [{id:'garden-example', author:'María', text:'Un paseo por el jardín · ilustración de ejemplo'}, ...state.chat.filter(item => item.type === 'photo')];
}
function photosPage() {
  const photos = galleryPhotos();
  photoIndex = Math.min(photoIndex, photos.length - 1);
  const visible = galleryPresentation ? [photos[photoIndex]] : photos;
  return `${pageHeader('Recuerdos compartidos', 'Mis fotos', 'Las fotos de ejemplo del chat aparecen aquí.')}<section class="card gallery-controls"><button class="secondary" data-action="gallery-mode" aria-pressed="${galleryPresentation}">${galleryPresentation ? 'Ver todas las fotos' : 'Ver de una en una'}</button>${galleryPresentation ? `<div class="button-row"><button class="secondary" data-action="photo-prev" ${photoIndex === 0 ? 'disabled' : ''}>Anterior</button><button class="primary" data-action="photo-next" ${photoIndex === photos.length - 1 ? 'disabled' : ''}>Siguiente</button></div><p role="status">Foto ${photoIndex + 1} de ${photos.length}</p>` : ''}</section><section class="photo-gallery">${visible.map(item => `<article class="card gallery-photo"><img src="assets/mvp-photo.svg" alt="Ilustración de un jardín con flores"><button class="secondary" data-action="photo-fullscreen" data-id="${escapeHtml(item.id)}">⛶ Ver en pantalla completa</button><h2>${escapeHtml(item.text)}</h2><p>Compartida por ${escapeHtml(item.author)}</p><button class="secondary" data-action="photo-heart" data-id="${escapeHtml(item.id)}" aria-pressed="${state.photoReactions.includes(item.id)}">${state.photoReactions.includes(item.id) ? '❤️ Me gusta' : '🤍 Me gusta esta foto'}</button></article>`).join('')}</section>`;
}
function aboutPage() {
  return `${pageHeader('AgeCare', 'Acerca de la app', 'El cuidado, en un mismo lugar.')}<section class="card about-card"><img src="assets/agecare-logo-transparente.png" alt="AgeCare" class="about-logo"><p>AgeCare reúne a la familia, al cuidador, al médico y a la persona mayor para organizar el día y mantener el contacto.</p><p>Versión MVP · prueba local.</p><p class="muted">Datos ficticios. Sin emergencias reales, pagos ni sincronización entre dispositivos.</p><button class="secondary" data-page="more">Volver a Más</button></section>`;
}

let memoryTheme = -1;
function startMemoryGame() {
  const themes=[['🌻','🌷','🌿','🌵'],['🐶','🐱','🐸','🦋'],['🍎','🍋','🍓','🍇'],['🚗','🚲','🚢','✈️'],['🎹','🎸','🥁','🎺']];
  memoryTheme=(memoryTheme+1)%themes.length;
  const cards=[...themes[memoryTheme],...themes[memoryTheme]];
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

function updatePhotoViewer() {
  const photos = galleryPhotos();
  document.querySelector('#viewer-caption').textContent = `${photos[fullscreenPhotoIndex].text} · ${fullscreenPhotoIndex+1} de ${photos.length}`;
  document.querySelector('[data-action="viewer-prev"]').disabled = fullscreenPhotoIndex === 0;
  document.querySelector('[data-action="viewer-next"]').disabled = fullscreenPhotoIndex === photos.length-1;
}
function openPhotoViewer() {
  const viewer = document.querySelector('#photo-viewer');
  updatePhotoViewer(); viewer.showModal();
  if (viewer.requestFullscreen) viewer.requestFullscreen().catch(() => {});
}
document.querySelector('#photo-viewer').addEventListener('close', () => {
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
});
let puzzleDrag = null, suppressPuzzleClick = false;
document.addEventListener('pointerdown', event => {
  const tile = event.target.closest('.puzzle-piece');
  if (!tile || currentRole !== 'Adulto mayor' || tile.disabled) return;
  puzzleDrag = { index:Number(tile.dataset.index), x:event.clientX, y:event.clientY, tile, moved:false };
  tile.setPointerCapture?.(event.pointerId);
});
document.addEventListener('pointermove', event => {
  if (!puzzleDrag) return;
  const dx=event.clientX-puzzleDrag.x, dy=event.clientY-puzzleDrag.y;
  if (Math.hypot(dx,dy)>12) { puzzleDrag.moved=true; puzzleDrag.tile.classList.add('dragging'); puzzleDrag.tile.style.transform=`translate(${dx}px,${dy}px)`; }
});
document.addEventListener('pointerup', event => {
  if (!puzzleDrag) return;
  const drag = puzzleDrag; puzzleDrag=null;
  drag.tile.style.transform=''; drag.tile.classList.remove('dragging');
  if (!drag.moved) return;
  suppressPuzzleClick=true;
  const tile=document.elementFromPoint(event.clientX,event.clientY)?.closest('.puzzle-piece');
  if (tile) leisure.swap(drag.index,Number(tile.dataset.index));
  render('entertainment');
  setTimeout(()=>{suppressPuzzleClick=false;},0);
});
document.addEventListener('pointercancel', () => {
  if (puzzleDrag) { puzzleDrag.tile.style.transform=''; puzzleDrag.tile.classList.remove('dragging'); puzzleDrag=null; }
});

function initialHealthEntries() {
  return [
    {id:'hv1',section:'vitals',title:'Pulso en reposo',date:'2026-10-08',time:'09:40',value:'72 lpm',note:'Registro ficticio de la pulsera.',author:'Equipo de cuidado'},
    {id:'hv2',section:'vitals',title:'Saturación de oxígeno',date:'2026-10-08',time:'09:40',value:'96 %',note:'Dato de ejemplo, sin interpretación clínica.',author:'Equipo de cuidado'},
    {id:'hv3',section:'vitals',title:'Presión arterial',date:'2026-10-08',time:'09:30',value:'128/78 mmHg',note:'Medición ficticia.',author:'Dr. Núñez'},
    {id:'hl1',section:'log',title:'Observación del desayuno',date:'2026-10-08',time:'09:35',value:'Buen apetito',note:'Elena desayunó acompañada. Paseo previsto durante la mañana.',author:'Rosa Medina'},
    {id:'doc3',section:'docs',title:'Antecedentes y apoyo diario',date:'2026-10-08',time:'09:00',value:'Ficha ficticia',note:'Condiciones: hipertensión y diabetes tipo 2. Alergia: penicilina. Movilidad: paseos acompañados; bastón en exteriores. Apoyo diario: Rosa acompaña la rutina; María coordina los controles. Todos son antecedentes ficticios.',author:'Dr. Núñez'},
    ...mvpDocuments.map(item=>({id:item.id,section:'docs',title:item.title,date:'2026-10-08',time:'10:00',value:'Ficha de texto',note:item.text,author:'Equipo de cuidado'}))
  ];
}
function healthEntryPanel() {
  const editing=state.healthEntries.find(item=>item.id===healthEdit && item.section===healthTab);
  const rows=state.healthEntries.filter(item=>item.section===healthTab).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const title=({vitals:'Mediciones registradas',log:'Eventos de la bitácora',docs:'Fichas documentales',medicines:'Observaciones del plan'})[healthTab];
  return `<section class="card"><h2>${title}</h2><div class="list">${rows.map(item=>`<article class="health-entry item"><div class="grow"><strong>${escapeHtml(item.title)}</strong><small>${formatDate(item.date)} · ${escapeHtml(item.time)}</small><b>${escapeHtml(item.value)}</b><p>${escapeHtml(item.note)}</p><small>Registrado por ${escapeHtml(item.author)}</small>${canEditHealth()?`<div class="button-row"><button class="secondary" data-action="health-edit" data-id="${item.id}">Editar</button><button class="secondary" data-action="health-delete" data-id="${item.id}">Quitar</button></div>`:''}</div></article>`).join('') || '<p>Aún no hay registros en esta sección.</p>'}</div></section>${canEditHealth()?`<section class="card"><h2>${editing?'Editar registro':'Añadir registro'}</h2><form id="health-entry-form"><label>Título<input id="entry-title" required maxlength="80" value="${escapeHtml(editing?.title||'')}"></label><div class="form-pair"><label>Fecha<input id="entry-date" type="date" required value="${editing?.date||localDateKey()}"></label><label>Hora<input id="entry-time" type="time" required value="${editing?.time||'10:00'}"></label></div><label>Valor o resumen<input id="entry-value" maxlength="80" value="${escapeHtml(editing?.value||'')}"></label><label>Contenido o detalle<textarea id="entry-note" maxlength="1200" required>${escapeHtml(editing?.note||'')}</textarea></label><button class="primary" type="submit">Guardar registro</button>${editing?'<button type="button" class="secondary" data-action="health-cancel">Cancelar</button>':''}<small>Información ficticia del MVP.</small></form></section>`:''}`;
}
function saveHealthEntry() {
  if(!canEditHealth()) return;
  const value=id=>document.querySelector('#entry-'+id).value.trim();
  const record={section:healthTab,title:value('title'),date:value('date'),time:value('time'),value:value('value'),note:value('note'),author:authorForRole()};
  if(!record.title || !record.note || !validDate(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) { showToast('Revisa el título, contenido, fecha y hora.'); return; }
  const existing=state.healthEntries.find(item=>item.id===healthEdit && item.section===healthTab);
  if(existing) Object.assign(existing,record); else state.healthEntries.push({id:id('h'),...record});
  healthEdit=null; notify(['Familia','Médico'], 'Registro de salud actualizado',record.title,'info',{destination:'health',healthTab});
  render('health'); showToast('Registro guardado.');
}
function assistantPage() {
  return `${pageHeader('Asistente AgeCare','¿En qué te ayudo?','Consulta los registros y encuentra una sección.')}<section class="card"><p class="notice">Modo local del MVP: respuestas guiadas con los datos guardados. IA generativa todavía no conectada.</p><div class="button-row">${['Próximo control','Resumen del día','Mis consultas','Ayuda con medicinas'].map(prompt=>`<button class="secondary" data-action="assistant-prompt" data-prompt="${prompt}">${prompt}</button>`).join('')}</div><div class="assistant-messages" aria-live="polite">${assistantMessages.map(item=>`<article class="item"><div><strong>${item.who}</strong><p>${escapeHtml(item.text)}</p></div></article>`).join('')}</div><form id="assistant-form"><label>Tu pregunta<textarea id="assistant-question" maxlength="400" required placeholder="Por ejemplo: ¿cuándo es el próximo control?"></textarea></label><button class="primary" type="submit">Consultar</button></form><button class="secondary" data-page="${state.role==='Cuidador'&&CAREGIVER_ID!=='cg1'?'inquiries':'health'}">Abrir registros</button></section>`;
}
function sendAssistant(prompt) {
  const question=String(prompt || document.querySelector('#assistant-question').value).trim(); if(!question) return;
  const q=question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let answer;
  if(/dolor|dosis|diagnostic|sintoma|sangr|receta|tratamiento/.test(q)) answer='No puedo evaluar síntomas ni indicar tratamientos. Comparte tu consulta con el médico del equipo. Este asistente solo organiza registros ficticios.';
  else if(state.role==='Cuidador' && CAREGIVER_ID!=='cg1') answer=`${profiles.Cuidador.name}, tienes ${state.caregiverChats.filter(item=>item.caregiverId===CAREGIVER_ID&&item.role==='Familia').length} mensajes recibidos. Abre Consultas para responder. No tienes acceso al expediente ni al chat del círculo de Elena.`;
  else if(/control|calendario|cita/.test(q)) { const next=state.appointments.filter(item=>item.date>=localDateKey()).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]; answer=next?`Próximo control registrado: ${next.title}, ${formatDate(next.date)} a las ${next.time}, en ${next.location}. Consulta el calendario para revisar o cambiar la cita.`:'No hay controles futuros registrados en el MVP.'; }
  else if(/medicina|medicamento/.test(q)) answer=`Hay ${state.medications.length} medicinas en el plan y ${state.medications.filter(item=>item.taken).length} administraciones registradas. Revisa Salud → Medicinas. Puedo mostrar registros, pero no recomendar dosis ni cambios de tratamiento.`;
  else if(/consulta|cuidadora/.test(q)) answer='Las consultas a cuidadoras están en Cuidadoras para Familia y en Consultas para cada cuidadora. Son conversaciones individuales, separadas del círculo familiar.';
  else if(/resumen|dia|rutina/.test(q)) answer=`En la rutina hay ${state.routine.filter(item=>!item.done).length} actividades pendientes. Se registraron ${state.healthEntries.length} fichas de salud y ${state.appointments.length} controles. Puedes revisar Salud o Calendario.`;
  else answer='Puedo orientarte sobre próximos controles, rutina, medicinas registradas y consultas a cuidadoras. Prueba uno de los botones de arriba. Mis respuestas son guiadas; no utilizo un modelo de IA.';
  assistantMessages.push({who:'Tú',text:question},{who:'AgeCare · local',text:answer}); render('assistant');
}
document.querySelectorAll('[data-caregiver-account]').forEach(button=>button.addEventListener('click',()=>{
  const account=Object.entries(mvpAccounts).find(([,item])=>item.caregiverId===button.dataset.caregiverAccount);
  document.querySelector('#login-email').value=account[0]; document.querySelector('#login-password').value=account[1].password;
}));

function localDateKey() { const now=new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
