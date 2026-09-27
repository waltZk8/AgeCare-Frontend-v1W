import '../../../core/domain/enums.dart';

/// Respuesta de `POST /api/v1/auth/register` (sección 3.1) y, cuando el
/// backend lo implemente, de `POST /api/v1/auth/login` (3.2): mismos
/// campos de tokens más los datos mínimos para arrancar la app sin una
/// llamada adicional a `GET /users/me`.
class AuthResultModel {
  final String userId;
  final String email;
  final RoleType? role;
  final String accessToken;
  final String refreshToken;

  const AuthResultModel({
    required this.userId,
    required this.email,
    this.role,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResultModel.fromJson(Map<String, dynamic> json) {
    return AuthResultModel(
      userId: json['user_id'] as String,
      email: json['email'] as String,
      // En el registro directo (sin invitación) `role` viaja en null: el
      // backend solo lo asigna cuando el registro viene de una invitación
      // (4.5/4.6), que todavía no está implementada.
      role: RoleType.fromApiOrNull(json['role'] as String?),
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
    );
  }
}
