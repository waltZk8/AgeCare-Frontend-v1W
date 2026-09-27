import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../storage/token_storage.dart';

/// Providers de infraestructura compartidos por todos los features
/// (equivalente a lo que en el proyecto Flutter existente vive detrás de
/// un `Provider`/`get_it` único de `ApiClient`).
final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(tokenStorage: ref.watch(tokenStorageProvider));
});
