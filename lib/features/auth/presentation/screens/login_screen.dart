import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Marcador de posición para el inicio de sesión.
///
/// El backend adjunto todavía no implementa `POST /auth/login` (sección
/// 3.2 de la Especificación de Endpoints Backend v1) — solo existen
/// `POST /auth/register`, `POST /patients` y `GET /patients/{id}` (ver
/// README.md del backend, sección 8). Esta pantalla existe únicamente
/// para que la ruta `/login` del enrutador sea coherente; se completa
/// cuando el equipo BE agregue login/refresh (equivalente al ticket
/// AGE-104 del Plan de Desarrollo).
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock_clock_outlined, size: 48),
              const SizedBox(height: 16),
              const Text(
                'El inicio de sesión aún no está disponible: el backend '
                'todavía no implementa POST /auth/login.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              OutlinedButton(
                onPressed: () => context.go('/register'),
                child: const Text('Crear una cuenta nueva'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
