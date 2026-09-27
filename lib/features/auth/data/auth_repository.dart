import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/auth_result_model.dart';

/// Repositorio del feature `auth`. Por ahora solo implementa el registro,
/// que es lo único que expone el backend adjunto (sección 3.1 de la
/// Especificación de Endpoints Backend v1; ver app/features/auth/router.py
/// — login, refresh, logout y recuperación de contraseña, 3.2 a 3.6,
/// quedan fuera de este hito del backend).
class AuthRepository {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  AuthRepository({required ApiClient apiClient, required TokenStorage tokenStorage})
      : _apiClient = apiClient,
        _tokenStorage = tokenStorage;

  /// POST /api/v1/auth/register
  ///
  /// Crea la cuenta de un familiar y persiste los tokens recibidos.
  ///
  /// Deliberadamente NO se expone un parámetro `invitationToken`: el
  /// registro por invitación depende de los endpoints 4.5/4.6, que este
  /// backend aún no implementa — `app/features/auth/service.py` responde
  /// 400 FEATURE_NOT_AVAILABLE si se envía ese campo, así que el cliente
  /// simplemente no lo ofrece todavía.
  Future<AuthResultModel> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
    String locale = 'es',
  }) {
    return guardApiCall(() async {
      final response = await _apiClient.dio.post('/auth/register', data: {
        'full_name': fullName,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'locale': locale,
      });

      final result = AuthResultModel.fromJson(response.data as Map<String, dynamic>);
      await _tokenStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return result;
    });
  }
}
