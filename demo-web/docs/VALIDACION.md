# Validación del MVP · 2026-10-11

44 pruebas automatizadas de lógica superadas. Se ejecutaron 28 grupos de comprobaciones de navegador sobre la entrega local original y una repetición focalizada final. Los scripts para repetirlos están en scripts/. Las capturas generadas no se incluyen en GitHub.

Se verificaron acceso obligatorio al recargar, temas, chat y desplazamiento, adjuntos ficticios, accesibilidad al 200 %, calendario compartido, notificaciones, siete cuidadoras con consultas propias, edición de las cuatro secciones de Salud, asistente local, rompecabezas 3×3, diferencias variables y figuras por puntos. El canal alfa del logo PNG va de 0 a 255.

Los recorridos automatizados se ejecutaron en Chromium con tamaños de móvil y tablet. Se revisaron capturas del tema oscuro y del rompecabezas. No se validó en dispositivos físicos, con lectores de pantalla reales ni con usuarios mayores. El contraste comprobado corresponde a tokens de texto; no certifica cada combinación visual posible.

Las restricciones de perfil son de interfaz local, no de backend. El asistente es guiado por reglas, sin IA generativa. Documentos son fichas textuales. Los adjuntos y la pulsera son simulados. No hay seguridad de producción ni sincronización entre navegadores.

Esta revisión se propone en una rama de frontend. No se ha fusionado en main ni se confirma un despliegue de producción.
