import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Tema visual de AgeCare (Guía de Diseño y paleta de colores v1.0).
///
/// Implementa la sección 10.1 (migración del tema de la app): primary
/// teal-600, secondary coral-500, fondo surface-bg (crema, no blanco),
/// tipografía Nunito Sans, y los radios/alturas de botones y campos de
/// las secciones 6.2 y 7 (radius-l = 14, alto de control = 52).
class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
    final textTheme = GoogleFonts.nunitoSansTextTheme(base.textTheme).apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.surfaceBg,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.teal600,
        onPrimary: Colors.white,
        secondary: AppColors.coral500,
        error: AppColors.attention600,
        surface: AppColors.surfaceCard,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surfaceBg,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.teal600,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.surfaceSunken,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.navy700,
          side: const BorderSide(color: AppColors.navy700, width: 2),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceCard,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.teal600, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.attention600, width: 1.6),
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}
