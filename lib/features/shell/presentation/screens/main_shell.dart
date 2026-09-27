import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import 'dashboard_screen.dart';
import 'placeholder_tab.dart';

/// Shell de navegación del familiar.
///
/// El wireframe define cinco pestañas (Hoy, Salud, Comunicación,
/// Marketplace, Más); este entregable implementa las cuatro pedidas
/// explícitamente. "Más" (gestión de pacientes, roles e invitaciones —
/// sección 3 del documento de Funcionalidades) es el siguiente paso
/// natural una vez que existan los endpoints de invitaciones (4.5-4.8).
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _tabs = [
    DashboardScreen(),
    PlaceholderTab(title: 'Salud', icon: Icons.favorite_outline),
    PlaceholderTab(title: 'Comunicación', icon: Icons.chat_bubble_outline),
    PlaceholderTab(title: 'Marketplace', icon: Icons.storefront_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surfaceCard,
        indicatorColor: AppColors.teal100,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Hoy'),
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            selectedIcon: Icon(Icons.favorite),
            label: 'Salud',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Comunicación',
          ),
          NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Marketplace',
          ),
        ],
      ),
    );
  }
}
