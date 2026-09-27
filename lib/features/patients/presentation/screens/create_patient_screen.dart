import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/domain/enums.dart';
import '../../../../core/network/api_exception.dart';
import '../providers/patients_providers.dart';

/// Formulario de alta del paciente (AGE-204: "Onboarding: crear perfil del
/// paciente"). Llama a `POST /api/v1/patients` y, tras crearlo, a
/// `GET /api/v1/patients/{id}` (ver `PatientsRepository.createPatient`).
class CreatePatientScreen extends ConsumerStatefulWidget {
  const CreatePatientScreen({super.key});

  @override
  ConsumerState<CreatePatientScreen> createState() => _CreatePatientScreenState();
}

class _CreatePatientScreenState extends ConsumerState<CreatePatientScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _conditionsController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime? _birthDate;
  SexType? _sex;

  @override
  void dispose() {
    _fullNameController.dispose();
    _conditionsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 75, now.month, now.day),
      firstDate: DateTime(now.year - 120),
      lastDate: now,
      helpText: 'Fecha de nacimiento',
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  List<String> _parseConditions(String raw) {
    return raw.split(',').map((c) => c.trim()).where((c) => c.isNotEmpty).toList();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_birthDate == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Selecciona la fecha de nacimiento')));
      return;
    }
    FocusScope.of(context).unfocus();

    await ref.read(createPatientControllerProvider.notifier).submit(
          fullName: _fullNameController.text.trim(),
          birthDate: _birthDate!,
          sex: _sex,
          conditions: _parseConditions(_conditionsController.text),
          notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        );

    if (!mounted) return;
    final state = ref.read(createPatientControllerProvider);
    state.whenOrNull(
      data: (patient) {
        if (patient != null) context.go('/shell');
      },
      error: (error, _) {
        final message =
            error is ApiException ? error.message : 'No pudimos crear el paciente. Intenta de nuevo.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(createPatientControllerProvider);
    final isLoading = createState.isLoading;
    final error = createState.error;
    String? fieldError(String field) => error is ApiException ? error.messageForField(field) : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Añadir paciente')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '¿A quién vas a cuidar?',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Podrás invitar a la cuidadora y al médico después.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _fullNameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: 'Nombre completo',
                    errorText: fieldError('full_name'),
                  ),
                  validator: (value) {
                    if ((value?.trim().length ?? 0) < 2) return 'Escribe el nombre completo';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: _pickBirthDate,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'Fecha de nacimiento',
                      errorText: fieldError('birth_date'),
                    ),
                    child: Text(
                      _birthDate == null
                          ? 'Toca para seleccionar'
                          : '${_birthDate!.day.toString().padLeft(2, '0')}/'
                              '${_birthDate!.month.toString().padLeft(2, '0')}/'
                              '${_birthDate!.year}',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<SexType>(
                  value: _sex,
                  decoration: const InputDecoration(labelText: 'Sexo (opcional)'),
                  items: const [
                    DropdownMenuItem(value: SexType.female, child: Text('Femenino')),
                    DropdownMenuItem(value: SexType.male, child: Text('Masculino')),
                    DropdownMenuItem(value: SexType.other, child: Text('Otro')),
                  ],
                  onChanged: (value) => setState(() => _sex = value),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _conditionsController,
                  decoration: const InputDecoration(
                    labelText: 'Padecimientos (opcional)',
                    hintText: 'Hipertensión, Artrosis',
                    helperText: 'Sepáralos con comas',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Notas (opcional)'),
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: isLoading ? null : _submit,
                  child: isLoading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                        )
                      : const Text('Crear paciente'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
