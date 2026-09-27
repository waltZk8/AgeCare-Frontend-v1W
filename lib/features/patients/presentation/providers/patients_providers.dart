import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/domain/enums.dart';
import '../../../../core/providers/core_providers.dart';
import '../../data/patients_repository.dart';
import '../../domain/patient_model.dart';

final patientsRepositoryProvider = Provider<PatientsRepository>((ref) {
  return PatientsRepository(apiClient: ref.watch(apiClientProvider));
});

/// `GET /api/v1/patients` (4.2). Ver la nota en
/// `PatientsRepository.listMyPatients` sobre por qué esta llamada todavía
/// puede fallar contra el backend adjunto — `DashboardScreen` la consume
/// mostrando un estado vacío en ese caso, no un error técnico.
final myPatientsProvider = FutureProvider.autoDispose<List<PatientModel>>((ref) {
  return ref.watch(patientsRepositoryProvider).listMyPatients();
});

/// Controlador del formulario "Añadir paciente".
class CreatePatientController extends AutoDisposeAsyncNotifier<PatientModel?> {
  @override
  FutureOr<PatientModel?> build() => null;

  Future<void> submit({
    required String fullName,
    required DateTime birthDate,
    SexType? sex,
    List<String> conditions = const [],
    String? notes,
  }) async {
    state = const AsyncLoading();
    final repo = ref.read(patientsRepositoryProvider);
    state = await AsyncValue.guard(() => repo.createPatient(
          fullName: fullName,
          birthDate: birthDate,
          sex: sex,
          conditions: conditions,
          notes: notes,
        ));
  }
}

final createPatientControllerProvider =
    AutoDisposeAsyncNotifierProvider<CreatePatientController, PatientModel?>(CreatePatientController.new);
