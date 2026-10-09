import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../theme/palettes.dart';

/// Colour theme, fonts, reading size and motion. Saved on this device, like the website's Settings page.
class AppearanceStore extends ChangeNotifier {
  final SharedPreferences prefs;
  AppearanceStore(this.prefs);

  String _s(String k, String d) => prefs.getString('look.$k') ?? d;

  String get palette => _s('palette', defaultThemeId);
  String get uiFont => _s('uiFont', 'archivo');
  String get readingFont => _s('readingFont', 'sourceserif');
  String get codeFont => _s('codeFont', 'jetbrains');
  double get readingScale => prefs.getDouble('look.readingScale') ?? 1.0;
  bool get reduceMotion => prefs.getBool('look.reduceMotion') ?? false;

  bool get isDefault =>
      palette == defaultThemeId && uiFont == 'archivo' && readingFont == 'sourceserif' && codeFont == 'jetbrains' && readingScale == 1.0 && !reduceMotion;

  Future<void> _set(String k, Object v) async {
    if (v is String) await prefs.setString('look.$k', v);
    if (v is double) await prefs.setDouble('look.$k', v);
    if (v is bool) await prefs.setBool('look.$k', v);
    notifyListeners();
  }

  void setPalette(String id) => _set('palette', id);
  void setUiFont(String id) => _set('uiFont', id);
  void setReadingFont(String id) => _set('readingFont', id);
  void setCodeFont(String id) => _set('codeFont', id);
  void setReadingScale(double v) => _set('readingScale', v);
  void setReduceMotion(bool v) => _set('reduceMotion', v);

  Future<void> reset() async {
    for (final k in ['palette', 'uiFont', 'readingFont', 'codeFont', 'readingScale', 'reduceMotion']) {
      await prefs.remove('look.$k');
    }
    notifyListeners();
  }
}
