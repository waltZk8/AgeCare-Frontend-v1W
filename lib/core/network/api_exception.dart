import 'package:dio/dio.dart';

/// Un campo con error de validación (`error.details[i]`, sección 2.4 de la
/// Especificación de Endpoints Backend v1). Lo produce el manejador global
/// de excepciones del backend (app/core/exceptions.py) a partir de los
/// errores de Pydantic en un 422.
class ApiErrorDetail {
  final String field;
  final String message;

  const ApiErrorDetail({required this.field, required this.message});

  factory ApiErrorDetail.fromJson(Map<String, dynamic> json) {
    return ApiErrorDetail(
      field: json['field'] as String? ?? '',
      message: json['message'] as String? ?? '',
    );
  }
}

/// Representa el formato estándar de error de la API AgeCare (sección 2.4
/// de la Especificación de Endpoints Backend v1; verificado contra
/// `app/core/exceptions.py` del backend adjunto):
///
/// ```json
/// { "error": { "code": "...", "message": "...", "details": [...], "request_id": "..." } }
/// ```
///
/// `message` ya viene en español y listo para mostrarse tal cual en la UI.
class ApiException implements Exception {
  final int statusCode;
  final String code;
  final String message;
  final List<ApiErrorDetail>? details;
  final String? requestId;

  const ApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    this.details,
    this.requestId,
  });

  factory ApiException.fromResponse(int statusCode, Map<String, dynamic> json) {
    final error = json['error'] as Map<String, dynamic>?;
    if (error == null) {
      return ApiException(
        statusCode: statusCode,
        code: 'UNKNOWN_ERROR',
        message: 'Ocurrió un error inesperado.',
      );
    }
    return ApiException(
      statusCode: statusCode,
      code: error['code'] as String? ?? 'UNKNOWN_ERROR',
      message: error['message'] as String? ?? 'Ocurrió un error inesperado.',
      details: (error['details'] as List<dynamic>?)
          ?.map((d) => ApiErrorDetail.fromJson(d as Map<String, dynamic>))
          .toList(),
      requestId: error['request_id'] as String?,
    );
  }

  factory ApiException.network() => const ApiException(
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'No pudimos conectar con el servidor. Revisa tu conexión.',
      );

  factory ApiException.timeout() => const ApiException(
        statusCode: 0,
        code: 'TIMEOUT',
        message: 'La solicitud tardó demasiado. Intenta de nuevo.',
      );

  /// Mensaje específico de un campo, para pintarlo bajo el TextFormField
  /// correspondiente en un 422 VALIDATION_ERROR.
  String? messageForField(String field) {
    if (details == null) return null;
    for (final d in details!) {
      if (d.field == field || d.field.endsWith('.$field')) return d.message;
    }
    return null;
  }

  @override
  String toString() => 'ApiException($code, $message)';
}

/// Traduce cualquier DioException en un [ApiException]: uno ya adjuntado
/// por el interceptor de `ApiClient`, o uno genérico de red/timeout.
extension DioExceptionToApiException on DioException {
  ApiException toApiException() {
    final err = error;
    if (err is ApiException) return err;
    return ApiException.network();
  }
}

/// Envuelve una llamada a `ApiClient.dio` traduciendo cualquier
/// DioException a [ApiException], para que repositorios y controladores
/// solo necesiten conocer un tipo de error.
Future<T> guardApiCall<T>(Future<T> Function() call) async {
  try {
    return await call();
  } on DioException catch (e) {
    throw e.toApiException();
  }
}
