import 'package:flutter/material.dart';

/// Marcador de posición para las pestañas que este entregable no
/// implementa todavía: Salud, Comunicación y Marketplace dependen de
/// módulos del backend (vitals, chat, asistente IA, marketplace) que no
/// forman parte del backend adjunto en esta etapa — solo están
/// implementados los módulos `auth` y `patients`.
class PlaceholderTab extends StatelessWidget {
  final String title;
  final IconData icon;

  const PlaceholderTab({super.key, required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text('$title llega en un próximo sprint', style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
