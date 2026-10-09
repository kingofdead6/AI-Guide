import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/api.dart';
import 'data/content.dart';
import 'state/appearance_store.dart';
import 'state/auth_store.dart';
import 'state/progress_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  final prefs = await SharedPreferences.getInstance();
  await Content.I.load();

  final api = Api(prefs);
  final progress = ProgressStore(prefs);
  final auth = AuthStore(prefs, api, progress);
  final appearance = AppearanceStore(prefs);
  auth.start();

  runApp(MultiProvider(
    providers: [
      Provider.value(value: api),
      ChangeNotifierProvider.value(value: progress),
      ChangeNotifierProvider.value(value: auth),
      ChangeNotifierProvider.value(value: appearance),
    ],
    child: const AcademyApp(),
  ));
}
