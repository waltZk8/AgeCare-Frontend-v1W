import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../patients/presentation/providers/patients_providers.dart';

/// "Hoy": resumen de bienestar por paciente (sección 4.1 del documento de
/// Funcionalidades). La versión completa depende de
/// `GET /api/v1/patients` (4.2, listado multi-paciente) y de
/// `GET .../summary/today` (5.7) — ninguno de los dos implementado
/// todavía en el backend adjunto, que solo expone `POST /patients` y
/// `GET /patients/{id}` para un paciente puntual.
///
/// Por eso esta pantalla intenta el listado y, si falla, muestra un
/// estado vacío invitando a añadir un paciente, en vez de simular datos
/// que el backend real no puede respaldar todavía.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final patientsAsync = ref.watch(myPatientsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Hoy')),
      body: patientsAsync.when(
        data: (patients) {
          if (patients.isEmpty) {
            return _EmptyState(onAdd: () => context.go('/patients/create'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: patients.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final patient = patients[i];
              return Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  title: Text(patient.fullName, style: Theme.of(context).textTheme.titleMedium),
                  subtitle: Text('${patient.age} años'),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) {
          // GET /patients (4.2) todavía no existe en el backend: se trata
          // como "todavía sin pacientes visibles", no como un error
          // técnico que el familiar tendría que interpretar.
          return _EmptyState(onAdd: () => context.go('/patients/create'));
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyState({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.family_restroom_outlined, size: 48),
            const SizedBox(height: 16),
            Text('Todavía no tienes pacientes', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Añade a tu primer paciente para empezar a verlo aquí.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: onAdd, child: const Text('Añadir paciente')),
          ],
        ),
      ),
    );
  }
}
