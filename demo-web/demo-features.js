const AgeCareFeatures = (() => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const emojis = ['😀','😄','😊','🥰','😍','🤗','🙂','😉','😌','😂','🥳','😎','😴','😢','😟','🤔','❤️','💙','💜','💛','💕','💐','🌷','🌻','🌿','☀️','🌈','⭐','🎉','🎂','☕','🍵','🍎','🍓','🥣','🍞','🐶','🐱','🦋','🐦','👍','👏','🙌','🙏','👋','💪','🫶','💬'];
  const appointments = [
    { id: 'a1', date: '2026-10-09', time: '16:00', title: 'Control general', clinician: 'Dr. Felipe Núñez', location: 'Consulta de ejemplo', note: 'Revisar registros de presión y rutina diaria.' },
    { id: 'a2', date: '2026-10-21', time: '10:30', title: 'Seguimiento de movilidad', clinician: 'Dra. Paula Rojas', location: 'Centro de cuidado ficticio', note: 'Conversar sobre paseos y apoyo al caminar.' },
    { id: 'a3', date: '2026-11-05', time: '09:00', title: 'Revisión del plan farmacológico', clinician: 'Dr. Felipe Núñez', location: 'Consulta de ejemplo', note: 'Revisar el plan registrado y las confirmaciones.' },
    { id: 'a4', date: '2026-12-03', time: '11:15', title: 'Control de seguimiento', clinician: 'Dr. Felipe Núñez', location: 'Consulta de ejemplo', note: 'Revisar observaciones del equipo.' },
    { id: 'a5', date: '2027-01-14', time: '15:00', title: 'Control de verano', clinician: 'Dr. Felipe Núñez', location: 'Consulta de ejemplo', note: 'Seguimiento programado ficticio.' },
  ];
  function calendarCells(year, month) {
    if (!Number.isInteger(year) || year < 1900 || year > 2100 || !Number.isInteger(month) || month < 0 || month > 11) return [];
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells = Array(offset).fill(null);
    for (let day = 1; day <= total; day++) cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [year, month] = value.split('-').map(Number);
    return calendarCells(year, month - 1).includes(value);
  }
  function preferences(value = {}) {
    return { theme: ['light', 'dark'].includes(value?.theme) ? value.theme : 'light', size: ['standard', 'comfortable', 'large'].includes(value?.size) ? value.size : 'standard' };
  }
  function formatDate(value) {
    if (!validDate(value)) return 'Fecha no válida';
    const [year, month, day] = value.split('-').map(Number);
    return `${day} de ${months[month - 1].toLowerCase()} de ${year}`;
  }
  return { months, emojis, appointments, calendarCells, validDate, preferences, formatDate };
})();
if (typeof module !== 'undefined') module.exports = AgeCareFeatures;
