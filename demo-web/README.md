# AgeCare — demo para Vercel

Demo estática de cuatro perfiles: Familia, Cuidador y Médico con interfaz móvil,
y Adulto mayor con interfaz de tablet accesible. Todos los nombres, lecturas,
medicamentos, mensajes, audios, notificaciones y perfiles de cuidadoras son
ficticios. No realiza solicitudes a APIs, no utiliza analítica y no contiene
funciones clínicas o de contratación reales.
Las consultas del marketplace aparecen en **Consultas** del perfil Cuidador,
separadas del chat familiar. Se pueden responder y marcar como aceptadas o
descartadas; el hilo y su estado se conservan en este navegador.

La pantalla de bienvenida incluye el logotipo local en `assets/welcome-image.png`.
La cabecera de la app utiliza el logo oficial completo en
`assets/agecare-logo-oficial.jpeg`, sin modificaciones.

## Interfaz y funciones

- Más → Configuración: modo claro/oscuro y tres tamaños de letra por perfil.
- Más → Acerca de AgeCare: presentación breve y alcance de la demo.
- Médico → Salud: mediciones, antecedentes, registros y observaciones ficticios.
- Médico → Agenda: calendario mensual con selección de año, controles por día y
  formulario de nuevos controles. Evita duplicados en la misma fecha y hora.
- Chat: texto, 48 emojis, foto ilustrada de ejemplo y audio local de tres segundos
  para los cuatro perfiles. El audio es un ejemplo sonoro, no una grabación de voz.
- Adulto mayor → Diversión: chistes, juego de parejas, preguntas y pausa tranquila.
- Familia → Cuidadoras: búsqueda por nombre/especialidad, filtro y fichas organizadas.

No se capturan fotografías, archivos personales ni micrófono. Solo el Médico
edita el plan de medicamentos; el Cuidador registra la administración.

## Acceso de demostración

La bienvenida ofrece cuatro botones que rellenan las cuentas públicas definidas
en el kit: Familia, Cuidador, Médico y Adulto mayor. También se pueden escribir
correo y contraseña manualmente. Para cambiar de perfil, pulsa **Salir** y
entra con otra cuenta. La sesión de demo y las conversaciones se conservan en
`localStorage` al recargar; salir no borra las conversaciones. Esto solo selecciona
una vista ficticia: no es autenticación segura ni protege datos reales.

## Ver localmente

```bash
python -m http.server 3000
```

Abre `http://localhost:3000`.

Si Python no está en el PATH de Windows, el runtime de esta sesión está en:

```powershell
& 'C:\Users\vrrus\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 3000
```

## Validar

```bash
node --test
```

## Publicar una vista previa

La demo se integra en `demo-web/` del repositorio Flutter de frontend. Al
importar ese repositorio en Vercel, configura **Root Directory** como
`demo-web`, **Framework Preset** como `Other` y deja el comando de build vacío.
Una rama de trabajo genera una URL Preview cuando la integración Git está
configurada. Revisa [DEPLOY.md](DEPLOY.md) antes de promover cambios a producción.

Consulta `docs/VALIDACION.md` para ver qué fue probado y qué falta revisar visualmente.
