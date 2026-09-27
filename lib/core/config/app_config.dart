/// Configuración de entorno de la app AgeCare.
///
/// Sigue el mismo patrón que ya documenta la Guía de Instalación y
/// Despliegue para agecare_app/lib/core/config/app_config.dart: todo se
/// resuelve con --dart-define en tiempo de compilación, sin archivos .env,
/// para poder generar builds de demo, desarrollo, staging y producción
/// desde el mismo código fuente.
library;

class AppConfig {
  AppConfig._();

  /// Si es true, la capa de repositorios debería usar datos de demostración
  /// en vez del backend real. Este módulo de red no implementa el modo
  /// mock en sí (eso vive en cada repositorio, eligiendo una implementación
  /// Http o Mock según este flag); solo lo expone como configuración global.
  static const bool useMocks = bool.fromEnvironment(
    'USE_MOCKS',
    defaultValue: true,
  );

  /// URL base del backend, SIN el sufijo de versión (se agrega abajo).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api-dev.agecare.app',
  );

  /// Application ID de Spike API (integración de wearables). No lo usan los
  /// módulos auth/patients de este entregable; se deja definido aquí porque
  /// es parte de la configuración global de la app (Referencia de
  /// Variables de Configuración AgeCare).
  static const int spikeAppId = int.fromEnvironment('SPIKE_APP_ID', defaultValue: 0);

  static const bool useWearableSimulator = bool.fromEnvironment(
    'USE_WEARABLE_SIMULATOR',
    defaultValue: true,
  );

  static const String _apiVersion = '/api/v1';

  /// URL base con el prefijo de versión ya incluido (sección 2.1 de la
  /// Especificación de Endpoints Backend v1): todas las rutas REST cuelgan
  /// de esta base.
  static String get apiV1BaseUrl => '$apiBaseUrl$_apiVersion';
}
