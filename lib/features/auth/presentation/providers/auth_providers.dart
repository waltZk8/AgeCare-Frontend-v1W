import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers/core_providers.dart';
import '../../data/auth_repository.dart';
import '../../domain/auth_result_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

/// Controlador del formulario de registro. Expone un `AsyncValue` que la
/// pantalla usa para mostrar el spinner del botón y los errores de la API
/// sin manejar el estado de carga a mano.
class RegisterController extends AutoDisposeAsyncNotifier<AuthResultModel?> {
  @override
  FutureOr<AuthResultModel?> build() => null;

  Future<void> submit({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    state = await AsyncValue.guard(() => repo.register(
          fullName: fullName,
          email: email,
          password: password,
          phone: phone,
        ));
  }
}

final registerControllerProvider =
    AutoDisposeAsyncNotifierProvider<RegisterController, AuthResultModel?>(RegisterController.new);
