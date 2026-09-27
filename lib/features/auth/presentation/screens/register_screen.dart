import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_exception.dart';
import '../providers/auth_providers.dart';

/// Pantalla de registro de una cuenta de familiar.
///
/// Llama a `POST /api/v1/auth/register` (sección 3.1 de la Especificación
/// de Endpoints Backend v1). No ofrece "unirme con una invitación": ese
/// flujo depende de los endpoints 4.5/4.6, que el backend adjunto todavía
/// no implementa (ver `AuthRepository.register`).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    await ref.read(registerControllerProvider.notifier).submit(
          fullName: _fullNameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        );

    if (!mounted) return;
    final state = ref.read(registerControllerProvider);
    state.whenOrNull(
      data: (result) {
        // Cuenta creada y sesión iniciada: el siguiente paso natural del
        // onboarding es crear el primer paciente (AGE-204).
        if (result != null) context.go('/patients/create');
      },
      error: (error, _) {
        final message =
            error is ApiException ? error.message : 'No pudimos crear tu cuenta. Intenta de nuevo.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final registerState = ref.watch(registerControllerProvider);
    final isLoading = registerState.isLoading;
    final error = registerState.error;
    String? fieldError(String field) => error is ApiException ? error.messageForField(field) : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Crea tu cuenta de familiar',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Para saber, de un vistazo, que tu ser querido está bien.',
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
                    if ((value?.trim().length ?? 0) < 2) return 'Escribe tu nombre completo';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Correo electrónico',
                    errorText: fieldError('email'),
                  ),
                  validator: (value) {
                    final v = value?.trim() ?? '';
                    final validEmail = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);
                    if (!validEmail) return 'Ingresa un correo válido';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Teléfono (opcional)',
                    hintText: '+56 9 1234 5678',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    errorText: fieldError('password'),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (value) {
                    final v = value ?? '';
                    if (v.length < 8) return 'Mínimo 8 caracteres';
                    if (!RegExp(r'[A-Za-z]').hasMatch(v) || !RegExp(r'[0-9]').hasMatch(v)) {
                      return 'Debe incluir al menos una letra y un número';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscurePassword,
                  decoration: const InputDecoration(labelText: 'Confirma tu contraseña'),
                  validator: (value) {
                    if (value != _passwordController.text) return 'Las contraseñas no coinciden';
                    return null;
                  },
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
                      : const Text('Crear cuenta'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: isLoading ? null : () => context.go('/login'),
                  child: const Text('Ya tengo una cuenta'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
