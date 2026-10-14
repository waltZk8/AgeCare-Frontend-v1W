/* Lectura voluntaria con voces que el navegador identifica como locales. */
const AgeCareAccessibility = (() => {
  function spokenText(text) {
    const names = {'❤️':'con cariño','💙':'con cariño','💜':'con cariño','💛':'con cariño','😊':'con una sonrisa','😀':'con una sonrisa','😄':'con una sonrisa','😂':'qué risa','👍':'de acuerdo','👋':'un saludo','🤗':'un abrazo','🥰':'con cariño','🌻':'una flor','💐':'flores','😢':'con tristeza','😟':'con preocupación','🎉':'a celebrar'};
    let result = String(text || '');
    for (const [emoji,label] of Object.entries(names)) result = result.replaceAll(emoji, `, ${label}. `);
    return result.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim();
  }
  function createReader(host, report = () => {}) {
    let generation = 0;
    const supported = () => Boolean(host?.SpeechSynthesisUtterance && ['cancel','speak','getVoices'].every(key => typeof host?.speechSynthesis?.[key] === 'function'));
    function stop(announce = true) {
      generation++;
      if (supported()) { try { host.speechSynthesis.cancel(); } catch (_) { /* el texto sigue disponible */ } }
      if (announce) report('Lectura detenida.');
    }
    function read(text) {
      if (!supported()) { report('Este navegador no tiene lectura en voz alta. Puedes leer el texto en pantalla.'); return false; }
      let voice;
      try { voice = host.speechSynthesis.getVoices().find((item) => item.localService && /^es(?:-|_|$)/i.test(item.lang)); }
      catch (_) { report('No se pudo cargar la voz del dispositivo. El texto sigue disponible.'); return false; }
      if (!voice) { report('No hay una voz local en español disponible. Instálala en los ajustes de voz de tu dispositivo y vuelve a intentarlo.'); return false; }
      const value = spokenText(text);
      if (!value) { report('No hay texto para escuchar.'); return false; }
      stop(false);
      const ticket = generation;
      const utterance = new host.SpeechSynthesisUtterance(value.slice(0, 6000));
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.96;
      utterance.pitch = 1.08;
      utterance.volume = 1;
      utterance.onend = () => { if (generation === ticket) report('Lectura terminada.'); };
      utterance.onerror = () => { if (generation === ticket) report('No se pudo reproducir la lectura. El texto sigue disponible.'); };
      try { host.speechSynthesis.speak(utterance); }
      catch (_) { report('No se pudo reproducir la lectura. El texto sigue disponible.'); return false; }
      report('Escuchando. Puedes detener la lectura.');
      return true;
    }
    return { read, stop };
  }
  return { createReader, spokenText };
})();
if (typeof module !== 'undefined') module.exports = AgeCareAccessibility;
