/// Modelo de usuario (tabla `users` del backend; Anexo A de la
/// Especificación de Endpoints Backend v1 y GET /api/v1/users/me).
///
/// El rol de este usuario NO vive aquí: vive en `PatientMemberModel`,
/// porque una misma persona puede tener un rol distinto según el paciente
/// — exactamente como en `app/models/user.py` del backend.
///
/// Se escribe a mano (sin freezed/json_serializable) para que el código
/// compile sin un paso de build_runner. Si el equipo adopta freezed más
/// adelante, esta clase es un candidato directo: los campos y el
/// fromJson/toJson ya siguen esa misma convención.
class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String locale;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.locale = 'es',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['user_id'] ?? json['id']) as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      locale: json['locale'] as String? ?? 'es',
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': id,
        'full_name': fullName,
        'email': email,
        'phone': phone,
        'avatar_url': avatarUrl,
        'locale': locale,
      };

  UserModel copyWith({
    String? fullName,
    String? phone,
    String? avatarUrl,
    String? locale,
  }) {
    return UserModel(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      locale: locale ?? this.locale,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          fullName == other.fullName &&
          email == other.email &&
          phone == other.phone &&
          avatarUrl == other.avatarUrl &&
          locale == other.locale;

  @override
  int get hashCode => Object.hash(id, fullName, email, phone, avatarUrl, locale);
}
