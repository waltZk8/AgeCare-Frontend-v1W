# Despliegue del MVP AgeCare

## Vercel

Repositorio: waltZk8/AgeCare-Frontend-v1W.

- Root Directory: `demo-web` (ruta existente conservada por compatibilidad).
- Framework Preset: Other.
- Sin comando de compilación ni variables de backend para esta versión local.
- Rama de esta revisión: `feat/mvp-local-mejorado-20261013`.

La revisión se sube a una rama y se propone mediante pull request. Si la integración Git está habilitada, Vercel puede generar un Preview para esa rama. Comprobar en el panel la rama, el commit y el resultado del despliegue antes de compartirlo. La URL de producción permanece en su versión previa mientras no se fusione y despliegue la revisión en la rama configurada para producción.

## Alcance

Este MVP web guarda datos ficticios en el navegador y ofrece un asistente local guiado. No consume FastAPI ni NVIDIA. Actualizar esta interfaz no conecta automáticamente PostgreSQL o la IA.

Flutter sigue en la raíz del repositorio. Las mejoras de HTML/CSS/JavaScript no se transfieren automáticamente a una APK Flutter de Codemagic. El proyecto Android conectado preparado localmente es otro incremento que requiere revisión e integración posteriores.

La carpeta usa el nombre de despliegue histórico `demo-web`; los archivos de aplicación y los textos visibles usan MVP.
