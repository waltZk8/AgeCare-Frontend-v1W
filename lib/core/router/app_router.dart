import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/patients/presentation/screens/create_patient_screen.dart';
import '../../features/shell/presentation/screens/main_shell.dart';

/// Enrutador de la app. `/register` es el punto de entrada por defecto:
/// el backend adjunto no tiene sesión persistida que consultar todavía
/// (no hay `GET /users/me` implementado), así que no hay forma de decidir
/// aquí si ya existe una sesión válida — eso se resuelve cuando el
/// backend agregue login/refresh (AGE-104).
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/register',
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/patients/create', builder: (context, state) => const CreatePatientScreen()),
      GoRoute(path: '/shell', builder: (context, state) => const MainShell()),
    ],
  );
});
