# AgeCare — Frontend Flutter (auth + patients)

Este entregable implementa la arquitectura feature-first pedida, alineada
1:1 con el backend FastAPI adjunto (`app/features/auth`, `app/features/patients`).

## Estructura

```
lib/
├── core/
│   ├── config/app_config.dart      # variables --dart-define (USE_MOCKS, API_BASE_URL, ...)
│   ├── domain/enums.dart           # RoleType, SexType — equivalente a app/models/enums.py
│   ├── network/
│   │   ├── api_client.dart         # Dio + interceptor de auth + parseo de errores
│   │   └── api_exception.dart      # modelo del error estándar + guardApiCall()
│   ├── providers/core_providers.dart
│   ├── router/app_router.dart      # GoRouter
│   ├── storage/token_storage.dart  # flutter_secure_storage
│   └── theme/                      # tokens y ThemeData de la Guía de Diseño v1.0
├── features/
│   ├── auth/
│   │   ├── domain/                 # UserModel, AuthResultModel
│   │   ├── data/auth_repository.dart
│   │   └── presentation/           # providers (Riverpod) + RegisterScreen, LoginScreen
│   ├── patients/
│   │   ├── domain/                 # PatientModel, PatientMemberModel
│   │   ├── data/patients_repository.dart
│   │   └── presentation/           # providers (Riverpod) + CreatePatientScreen
│   └── shell/presentation/screens/ # MainShell (bottom nav), DashboardScreen, PlaceholderTab
└── main.dart
```

## Dependencias a agregar en `pubspec.yaml`

Este código asume estos paquetes (ajusta versiones a lo que ya use el
proyecto Flutter existente, si `agecare_app` ya tiene un `pubspec.yaml`):

```yaml
dependencies:
  flutter_riverpod: ^2.5.0
  go_router: ^14.0.0
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
  google_fonts: ^6.2.0
```

Si prefieres no depender de red para la tipografía (más confiable para
demos sin conexión), reemplaza `google_fonts` por los archivos de Nunito
Sans como assets — la propia Guía de Diseño (5.1) lo deja como alternativa
válida.

## Endpoints realmente conectados

| Pantalla | Endpoint | Estado en el backend adjunto |
|---|---|---|
| `RegisterScreen` | `POST /api/v1/auth/register` | ✅ implementado |
| `CreatePatientScreen` | `POST /api/v1/patients` → `GET /api/v1/patients/{id}` | ✅ implementado |
| `DashboardScreen` | `GET /api/v1/patients` (listado) | ⚠️ no implementado — la pantalla degrada a un estado vacío en vez de fallar |
| `LoginScreen` | `POST /api/v1/auth/login` | ⚠️ no implementado — pantalla marcador de posición |
| Refresh de sesión (`ApiClient`) | `POST /api/v1/auth/refresh` | ⚠️ no implementado — el interceptor 401 queda listo pero hoy no tiene qué llamar |

No se inventó ninguno de estos tres endpoints pendientes: se dejó el
código de cliente (repositorio/interceptor) preparado contra la forma que
describe la Especificación de Endpoints Backend v1, para no tener que
reescribir la capa de datos cuando el equipo BE los agregue (AGE-104 y
AGE-201 del Plan de Desarrollo).

## Decisiones de diseño

- **Modelos escritos a mano** (sin `freezed`/`json_serializable`): así el
  código compila sin un paso de `build_runner`. Si el equipo adopta
  `freezed`, los campos y `fromJson`/`toJson` ya siguen esa convención y
  la migración es mecánica.
- **Manejo de errores centralizado**: `ApiClient` traduce cualquier
  `DioException` a `ApiException` (mismo `code`/`message`/`details` que
  documenta la sección 2.4 de la especificación), y `guardApiCall()` es el
  único punto donde los repositorios necesitan capturar excepciones.
- **Tema**: los colores viven en `AppColors` con los mismos nombres de
  token que el Anexo A de la Guía de Diseño (`teal600`, `navy800`, ...),
  para que un cambio de paleta futuro sea un solo archivo.
