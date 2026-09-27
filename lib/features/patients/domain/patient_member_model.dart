import '../../../core/domain/enums.dart';

/// Modelo de membresía (tabla `patient_members`): conecta un usuario con
/// un paciente y el rol que ejerce ahí. Es la tabla de autorización
/// central del backend (ver `app/models/patient_member.py`): todo endpoint
/// sobre un paciente valida el acceso consultando aquí.
class PatientMemberModel {
  final String patientId;
  final String userId;
  final RoleType role;
  final bool isOwner;

  const PatientMemberModel({
    required this.patientId,
    required this.userId,
    required this.role,
    required this.isOwner,
  });

  factory PatientMemberModel.fromJson(Map<String, dynamic> json) {
    return PatientMemberModel(
      patientId: json['patient_id'] as String,
      userId: json['user_id'] as String,
      role: RoleType.fromApi(json['role'] as String),
      isOwner: json['is_owner'] as bool? ?? false,
    );
  }
}
