import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Almacenamiento seguro de los tokens de sesión.
///
/// Usa `flutter_secure_storage` (Keychain en iOS, Keystore en Android con
/// `encryptedSharedPreferences` habilitado) — nunca `SharedPreferences` ni
/// almacenamiento plano, tal como exige la Documentación de Seguridad
/// (sección 2.3, verificada contra el código real de agecare_app/lib/core).
class TokenStorage {
  final FlutterSecureStorage _storage;

  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  static const _accessTokenKey = 'agecare_access_token';
  static const _refreshTokenKey = 'agecare_refresh_token';

  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> get accessToken => _storage.read(key: _accessTokenKey);

  Future<String?> get refreshToken => _storage.read(key: _refreshTokenKey);

  /// Limpia la sesión local (logout, o refresh fallido — ver ApiClient).
  Future<void> clear() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }
}
