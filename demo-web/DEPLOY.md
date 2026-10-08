# Publicación de la demo AgeCare

## Repositorios

- Frontend existente: `waltZk8/AgeCare-Frontend-v1W`. Flutter permanece en la raíz. Esta demo está en `demo-web/`.
- Backend existente: `waltZk8/Backend-AgeCareW`. Es FastAPI y se mantiene separado. La demo web no lo consulta.

## Vista previa en Vercel

1. Importa `waltZk8/AgeCare-Frontend-v1W` desde Vercel con la cuenta de GitHub que tenga acceso al repositorio.
2. Selecciona `demo-web` como **Root Directory** y `Other` como **Framework Preset**. No configures comandos de build ni variables de entorno para esta demo estática.
3. Confirma que la rama `feat/mvp-vercel-20261009` produce una **Preview Deployment**. Abre la URL que Vercel entregue; no supongas ni publiques una URL antes de verla.
4. Comprueba en móvil y escritorio: cuatro accesos, logo, chat Familia–Cuidador, Consultas del marketplace, calendario, ajustes, imágenes y audio. Ejecuta las pruebas locales con `node --test`.
5. Para actualizar la URL de producción en Vercel, revisa y fusiona la solicitud de cambios a `main` cuando la empresa apruebe la demo. No ejecutes `vercel --prod` para una vista previa.

Vercel crea despliegues a partir de los commits de las ramas conectadas. La URL Preview pertenece al despliegue generado; verifica la URL actual en el panel de Vercel tras cada push.

## Flutter, Codemagic y backend

Codemagic debe tomar el proyecto Flutter de la **raíz** del mismo repositorio de frontend. Su compilación automática depende de configurar un workflow y sus eventos de disparo; agregar `demo-web/` por sí solo no crea una aplicación móvil compilada.

Render puede alojar el repositorio FastAPI independiente cuando estén listos la base de datos, las variables de entorno y los endpoints reales de sesión. El backend existente todavía no implementa login, refresh ni logout reales. No es necesario para compartir la demo Vercel, que usa datos ficticios locales.
