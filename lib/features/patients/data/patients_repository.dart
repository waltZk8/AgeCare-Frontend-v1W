import '../../../core/domain/enums.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../domain/patient_model.dart';

/// Repositorio del feature `patients`.
///
/// Implementa exactamente lo que expone el backend adjunto: crear un
/// paciente (4.1) y consultar su detalle (4.3). El listado multi-paciente
/// (4.2) queda declarado y documentado más abajo porque el flujo de
/// onboarding lo va a necesitar, pero el backend todavía no lo implementa.
class PatientsRepository {
  final ApiClient _apiClient;

  PatientsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// `POST /api/v1/patients` seguido de `GET /api/v1/patients/{id}`.
  ///
  /// Replica el flujo real ya documentado en el README del backend: la
  /// respuesta de creación (`PatientCreateResponse`) no trae todos los
  /// campos del paciente, así que se pide el detalle completo de
  /// inmediato en vez de asumir que el 201 alcanza para pintar la UI.
  Future<PatientModel> createPatient({
    required String fullName,
    required DateTime birthDate,
    SexType? sex,
    String? photoUrl,
    List<String> conditions = const [],
    String? notes,
  }) {
    return guardApiCall(() async {
      final createResponse = await _apiClient.dio.post('/patients', data: {
        'full_name': fullName,
        'birth_date': _formatDate(birthDate),
        if (sex != null) 'sex': sex.apiValue,
        if (photoUrl != null) 'photo_url': photoUrl,
        'conditions': conditions,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      });

      final patientId = (createResponse.data as Map<String, dynamic>)['patient_id'] as String;
      return getPatient(patientId);
    });
  }

  /// `GET /api/v1/patients/{patient_id}` (4.3). 403 si el usuario no
  /// pertenece al círculo de cuidado del paciente; 404 si no existe.
  Future<PatientModel> getPatient(String patientId) {
    return guardApiCall(() async {
      final response = await _apiClient.dio.get('/patients/$patientId');
      return PatientModel.fromJson(response.data as Map<String, dynamic>);
    });
  }

  /// `GET /api/v1/patients` — listado multi-paciente (4.2), que alimenta
  /// el selector de paciente y el Inicio con más de un adulto mayor.
  ///
  /// NOTA: este endpoint todavía NO existe en el backend adjunto, que solo
  /// implementa `POST /patients` y `GET /patients/{id}` (ver README.md del
  /// backend, sección 8: "Quedan fuera de alcance ... GET /patients").
  /// Se deja implementado contra la forma que describe la especificación
  /// para que `DashboardScreen` no tenga que reescribirse cuando el equipo
  /// BE lo agregue (ticket AGE-201) — hasta entonces, la llamada
  /// simplemente fallará (hoy con 404 de ruta no encontrada) y la UI lo
  /// trata como "todavía sin pacientes visibles", no como un error técnico.
  Future<List<PatientModel>> listMyPatients() {
    return guardApiCall(() async {
      final response = await _apiClient.dio.get('/patients');
      final items = (response.data as Map<String, dynamic>)['items'] as List<dynamic>;
      return items.map((e) => PatientModel.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  String _formatDate(DateTime date) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${date.year}-${two(date.month)}-${two(date.day)}';
  }
}
