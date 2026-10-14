# AgeCare — MVP local · 11 de octubre de 2026

## Cómo probar

1. Extrae el RAR completo. En GitHub, abre la carpeta `demo-web` (ruta conservada para Vercel).
2. Ejecuta `INICIAR_MVP.bat` y abre http://localhost:3000. Mantén esa ventana abierta.
3. También puedes abrir `index.html`; utiliza siempre el mismo navegador y la misma dirección para conservar los registros.
4. Elige una cuenta de acceso o despliega «Entrar como otra cuidadora». Cada apertura vuelve al inicio de sesión.

Esta revisión incorpora la entrega local del 11 de octubre. Está preparada para una rama de revisión; su presencia en GitHub no demuestra un despliegue de producción.

## Cuentas públicas de prueba

| Perfil | Correo | Contraseña |
|---|---|---|
| Familia · María | familia@agecare.mvp | Familia123! |
| Cuidadora · Rosa | cuidador@agecare.mvp | Cuidador123! |
| Cuidadora · Ana | ana@agecare.mvp | Ana123! |
| Cuidadora · Lucía | lucia@agecare.mvp | Lucia123! |
| Cuidadora · Marta | marta@agecare.mvp | Marta123! |
| Cuidadora · Patricia | patricia@agecare.mvp | Patricia123! |
| Cuidadora · Carmen | carmen@agecare.mvp | Carmen123! |
| Cuidadora · Daniela | daniela@agecare.mvp | Daniela123! |
| Médico | medico@agecare.mvp | Medico123! |
| Adulto mayor · Elena | elena@agecare.mvp | Adulto123! |

No son cuentas de autenticación segura: seleccionan personajes ficticios del MVP.

## Cambios de esta entrega

- Logo PNG con transparencia en portada, cabecera y Acerca de; sin placa blanca en modo oscuro. Se conserva también el original.
- Salud: Familia y Médico añaden, editan y quitan mediciones, notas de bitácora, fichas documentales y observaciones de medicamentos. El plan farmacológico también admite edición. Las modificaciones de Familia se identifican como pendientes de revisión médica.
- Calendario: Familia, Médico y Rosa pueden gestionar controles. Adulto mayor puede consultarlos.
- Cada cuidadora tiene su acceso y sus consultas individuales. Rosa es la cuidadora asignada al círculo ficticio de Elena; las otras seis acceden únicamente a sus consultas y preferencias, no al expediente ni al chat grupal. Aceptar una consulta no cambia automáticamente la asignación.
- Eliminado Artículos. Cuidadoras permanece separado de Familia (chat del círculo).
- Más → Asistente AgeCare: resumen de registros, controles, medicinas y orientación de navegación. Es un asistente local con respuestas guiadas, NO un modelo de IA generativa conectado.
- Diversión: cinco conjuntos de emojis para parejas; rompecabezas de 4 o 9 piezas con nuevas mezclas; tres rondas de diferencias; casa, barco y estrella para conectar puntos. Sin cronómetro ni evaluación clínica.
- Carpeta, archivos de funcionamiento y textos de producto renombrados a MVP. Solo se conservan dos claves internas antiguas para recuperar datos locales de versiones anteriores.
- Se mantienen chat con emojis y adjuntos de ejemplo, tema estable, accesibilidad, fotos y notificaciones.

## Recorrido sugerido

1. Entra como Familia, abre Cuidadoras y envía una consulta a Marta.
2. Sal, entra como Marta y responde en Consultas. Entra como Rosa: la consulta de Marta no aparece.
3. Vuelve a Familia y revisa la respuesta de Marta. El chat Familia no debe contenerla.
4. En Salud, prueba las cuatro pestañas: añade un registro, edítalo, recarga, vuelve a iniciar sesión y comprueba que sigue. Después quítalo.
5. En Medicinas → Gestionar el plan, añade una medicina ficticia. Comprueba su autor y estado desde Médico.
6. Reprograma un control desde Familia y revísalo en el calendario del resto del círculo.
7. Más → Asistente: pregunta «Resumen del día» o «Próximo control». Las respuestas usan los registros locales.
8. Entra como Elena y prueba Nueva partida, 3 × 3, Otro jardín y Otra figura.
9. Cambia modo claro/oscuro y tamaño de letra; recarga y cambia de cuenta para comprobar las preferencias.

## Alcance real y límites

MVP significa producto mínimo viable: sirve para validar una propuesta con usuarios. Una demo es una presentación de un producto. Este MVP local permite demostrar y probar recorridos; cambiarle el nombre no implica que ya esté listo para operar con pacientes.

Todos los datos son ficticios. Las contraseñas y filtros de acceso están en el navegador; no son seguridad de servidor. Los datos se guardan en localStorage del mismo origen. No hay sincronización entre dispositivos ni backend conectado. No ingresar datos reales de salud.

Documentos contiene fichas de texto editables: no es un repositorio de archivos PDF. Fotos y audios del chat son ejemplos locales; no hay subida de archivos ni grabación real. La pulsera está simulada. El asistente no diagnostica ni recomienda tratamientos y no usa IA generativa; para conectarla hace falta un backend y un proveedor con credenciales privadas del servidor.

En otra carpeta, navegador o dirección podrían no aparecer los registros anteriores. Reiniciar datos es una acción local. Los correos `.mvp` son identificadores ficticios, no buzones.

## Comprobación técnica

- 44 pruebas automatizadas de lógica pasan.
- 28 grupos de recorridos en Chromium pasan: perfiles, chat, accesibilidad al 200 %, calendario, notificaciones, cuentas, Salud y juegos.
- Comprobación adicional de los cambios nuevos tras los ajustes visuales finales.
- Capturas y resultados en `docs/verificacion-navegador/`.
- No equivale a validación con adultos mayores reales ni certificación de accesibilidad o seguridad.

Para ejecutar lógica: `node --test`. Para recorridos: `node scripts/browser-check.cjs` con Playwright y Chromium instalados. Se probaron pantallas de 390 × 844 y 1024 × 768.

## Archivos

`index.html`, `app.js`, `styles.css`, `visual-accessibility.css`, `mvp-auth.js`, `mvp-features.js`, `mvp-accessibility.js`, `mvp-games.js` y `assets/` forman la aplicación. Esta carpeta no requiere compilación para abrirse localmente. `tests/` y `scripts/` permiten repetir las verificaciones.

Para Vercel usa Root Directory `demo-web`, preset Other y sin compilación. La carpeta conserva ese nombre por compatibilidad con la configuración existente. El proyecto Flutter de la raíz es independiente: estas mejoras web no actualizan automáticamente una APK de Codemagic.
