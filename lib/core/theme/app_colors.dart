import 'package:flutter/material.dart';

/// Tokens de color de AgeCare (Guía de Diseño y paleta de colores v1.0,
/// Anexo A). Los nombres siguen los mismos tokens documentados ahí
/// (`AppColors.teal600` == `AgeColors.teal600` en Dart == `--ac-teal-600`
/// en CSS), para que el equipo hable el mismo idioma en las tres
/// superficies (app, web app, web admin).
class AppColors {
  AppColors._();

  static const navy900 = Color(0xFF0D1F33);
  static const navy800 = Color(0xFF12283F);
  static const navy700 = Color(0xFF1B3A5A);
  static const navy500 = Color(0xFF3A5A7C);
  static const navy100 = Color(0xFFDCE4EE);

  static const teal700 = Color(0xFF0A5453);
  static const teal600 = Color(0xFF0E7C7B);
  static const teal500 = Color(0xFF1B9594);
  static const teal100 = Color(0xFFD9ECEB);

  static const coral700 = Color(0xFFB8482E);
  static const coral500 = Color(0xFFE8765A);
  static const coral100 = Color(0xFFFDEDE7);

  static const gold700 = Color(0xFF8A6300);
  static const gold500 = Color(0xFFD9A300);
  static const gold100 = Color(0xFFF8EBBF);

  static const surfaceBg = Color(0xFFF7F4EE);
  static const surfaceCard = Color(0xFFFFFFFF);
  static const surfaceSunken = Color(0xFFEFEAE1);
  static const border = Color(0xFFE3DED4);

  static const textPrimary = Color(0xFF12283F);
  static const textSecondary = Color(0xFF5B6573);
  static const textTertiary = Color(0xFF7C8794);

  static const ok600 = Color(0xFF247A4A);
  static const ok100 = Color(0xFFE1F4E7);
  static const warn500 = Color(0xFFE9A23B);
  static const warn100 = Color(0xFFFCEFD1);
  static const attention600 = Color(0xFFC8362B);
  static const attention100 = Color(0xFFFADCD8);
}
