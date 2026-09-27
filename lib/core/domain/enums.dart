/// Enumeraciones de dominio compartidas entre features.
///
/// Equivalente en Flutter a `app/models/enums.py` del backend: viven en un
/// lugar compartido (no dentro de un solo feature) porque tanto `auth` como
/// `patients` las necesitan, igual que `PatientMember` y `Patient` importan
/// `RoleType`/`SexType` desde ese mismo módulo compartido en el backend.
///
/// Los valores (`.name`, en minúsculas) son exactamente los que define la
/// sección 2.6 ("Enumeraciones globales") de la Especificación de Endpoints
/// Backend v1, y los mismos que persiste PostgreSQL. No cambiar estos
/// valores sin coordinar con el backend: viajan tal cual en el JSON.
library;

enum RoleType {
  family,
  caregiver,
  doctor,
  elder;

  String get apiValue => name;

  static RoleType fromApi(String value) {
    return RoleType.values.firstWhere(
      (r) => r.apiValue == value,
      orElse: () => throw FormatException('Rol desconocido: $value'),
    );
  }

  static RoleType? fromApiOrNull(String? value) => value == null ? null : fromApi(value);
}

/// Sexo del paciente (`patients.sex`). Opcional en el modelo.
enum SexType {
  female,
  male,
  other;

  String get apiValue => name;

  static SexType? fromApi(String? value) {
    if (value == null) return null;
    return SexType.values.firstWhere(
      (s) => s.apiValue == value,
      orElse: () => throw FormatException('Sexo desconocido: $value'),
    );
  }
}
