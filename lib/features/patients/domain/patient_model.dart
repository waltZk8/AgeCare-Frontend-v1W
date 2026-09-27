import '../../../core/domain/enums.dart';

/// Modelo del perfil del adulto mayor (tabla `patients`; endpoints 4.1
/// "Crear paciente" y 4.3 "Detalle de paciente" de la Especificación de
/// Endpoints Backend v1).
class PatientModel {
  final String id;
  final String fullName;
  final DateTime birthDate;
  final SexType? sex;
  final String? photoUrl;
  final List<String> conditions;
  final String? notes;

  const PatientModel({
    required this.id,
    required this.fullName,
    required this.birthDate,
    this.sex,
    this.photoUrl,
    this.conditions = const [],
    this.notes,
  });

  /// Responde tanto a `PatientCreateResponse` (4.1, trae menos campos)
  /// como a `PatientDetailResponse` (4.3, completo): los campos ausentes
  /// simplemente quedan en su valor por defecto. `PatientsRepository`
  /// siempre encadena create -> get, así que en la práctica este modelo
  /// se construye a partir de la respuesta completa.
  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['patient_id'] as String,
      fullName: json['full_name'] as String,
      birthDate:
          json['birth_date'] != null ? DateTime.parse(json['birth_date'] as String) : DateTime.now(),
      sex: SexType.fromApi(json['sex'] as String?),
      photoUrl: json['photo_url'] as String?,
      conditions: (json['conditions'] as List<dynamic>? ?? const []).map((c) => c as String).toList(),
      notes: json['notes'] as String?,
    );
  }

  /// Cuerpo para `POST /api/v1/patients` (4.1).
  Map<String, dynamic> toCreateJson() {
    String two(int n) => n.toString().padLeft(2, '0');
    return {
      'full_name': fullName,
      'birth_date': '${birthDate.year}-${two(birthDate.month)}-${two(birthDate.day)}',
      if (sex != null) 'sex': sex!.apiValue,
      if (photoUrl != null) 'photo_url': photoUrl,
      'conditions': conditions,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }

  /// Edad en años cumplidos, para mostrar en tarjetas ("Elena, 78").
  int get age {
    final now = DateTime.now();
    var years = now.year - birthDate.year;
    final birthdayPassedThisYear =
        now.month > birthDate.month || (now.month == birthDate.month && now.day >= birthDate.day);
    if (!birthdayPassedThisYear) years--;
    return years;
  }
}
