import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kDebugMode;

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

/// Cliente HTTP central de AgeCare, sobre `dio`.
///
/// Resuelve dos cosas que exige la Especificación de Endpoints Backend v1:
///   1. Adjuntar `Authorization: Bearer <access_token>` en toda ruta
///      protegida (sección 2.2), pero nunca en las rutas públicas.
///   2. Traducir el formato estándar de error de la sección 2.4 — y
///      verificado contra `app/core/exceptions.py` del backend — a
///      [ApiException] antes de que llegue a repositorios o UI.
class ApiClient {
  final Dio dio;
  final TokenStorage _tokenStorage;

  /// Rutas "Público (sin token)" de la especificación: nunca llevan el
  /// header Authorization.
  static const _publicPaths = <String>[
    '/auth/register',
    '/auth/login',
    '/auth/refresh',
    '/auth/password/recovery',
    '/auth/password/reset',
  ];

  ApiClient({TokenStorage? tokenStorage, Dio? dioClient})
      : _tokenStorage = tokenStorage ?? TokenStorage(),
        dio = dioClient ??
            Dio(
              BaseOptions(
                baseUrl: AppConfig.apiV1BaseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
                headers: const {'Content-Type': 'application/json'},
              ),
            ) {
    dio.interceptors.addAll([
      _authHeaderInterceptor(),
      _errorInterceptor(),
      if (kDebugMode) LogInterceptor(requestBody: true, responseBody: true),
    ]);
  }

  bool _isPublic(String path) => _publicPaths.any((p) => path.contains(p));

  Interceptor _authHeaderInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (!_isPublic(options.path)) {
          final token = await _tokenStorage.accessToken;
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },
    );
  }

  Interceptor _errorInterceptor() {
    return InterceptorsWrapper(
      onError: (DioException e, handler) async {
        final response = e.response;
        final alreadyRetried = e.requestOptions.extra['agecare_retried'] == true;

        // 401 sobre una ruta protegida: se intenta refrescar el access
        // token una sola vez, tal como describe la Documentación de
        // Seguridad (sección 2.3, "un interceptor intenta renovar el
        // access token una sola vez y reintenta la petición original").
        //
        // NOTA: POST /auth/refresh (3.3 de la especificación) todavía no
        // existe en el backend adjunto (solo están implementados
        // /auth/register, POST /patients y GET /patients/{id}). Este
        // bloque queda listo para cuando se agregue: hoy _tryRefreshToken
        // simplemente falla y se cae al manejo de error normal de abajo.
        if (response?.statusCode == 401 && !_isPublic(e.requestOptions.path) && !alreadyRetried) {
          final refreshed = await _tryRefreshToken();
          if (refreshed) {
            final retryOptions = e.requestOptions;
            retryOptions.extra['agecare_retried'] = true;
            final token = await _tokenStorage.accessToken;
            if (token != null) retryOptions.headers['Authorization'] = 'Bearer $token';
            try {
              final retryResponse = await dio.fetch(retryOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              // Cae al manejo de error normal si el reintento también falla.
            }
          } else {
            await _tokenStorage.clear();
            // TODO: exponer un stream/callback (equivalente a
            // onSessionExpired en agecare_app) para que la capa de
            // presentación fuerce el logout cuando el refresh falla.
          }
        }

        if (response != null) {
          if (response.data is Map<String, dynamic>) {
            final apiException = ApiException.fromResponse(
              response.statusCode ?? 0,
              response.data as Map<String, dynamic>,
            );
            return handler.next(e.copyWith(error: apiException));
          }
          return handler.next(e.copyWith(
            error: ApiException(
              statusCode: response.statusCode ?? 0,
              code: 'HTTP_ERROR',
              message: 'Ocurrió un error al procesar la solicitud.',
            ),
          ));
        }

        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.sendTimeout) {
          return handler.next(e.copyWith(error: ApiException.timeout()));
        }

        return handler.next(e.copyWith(error: ApiException.network()));
      },
    );
  }

  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await _tokenStorage.refreshToken;
      if (refreshToken == null) return false;

      // Cliente Dio aparte, sin interceptores, para no reentrar en este
      // mismo manejador de error si el refresh también devuelve 401.
      final plainDio = Dio(BaseOptions(baseUrl: AppConfig.apiV1BaseUrl));
      final response = await plainDio.post('/auth/refresh', data: {'refresh_token': refreshToken});
      final data = response.data as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['access_token'] as String,
        refreshToken: data['refresh_token'] as String,
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}
