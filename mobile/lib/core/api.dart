import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Default server: the deployed API. Override at build time with --dart-define=API_URL=...
/// (for a local server on the Android emulator use http://10.0.2.2:4000).
const defaultServerUrl = String.fromEnvironment('API_URL', defaultValue: 'https://ai-guide-uo4m.onrender.com');

/// Where the website is hosted, for the policy pages and "Open the website". Defaults to the API address,
/// which only works when the server also serves the built website.
const siteBaseUrl = String.fromEnvironment('SITE_URL');

class ApiError implements Exception {
  final String message;
  final int status;
  ApiError(this.message, this.status);
  bool get offline => status == 0;
  @override
  String toString() => message;
}

class Api {
  static const _tokenKey = 'aiguide-token';
  static const _serverKey = 'server-url';
  final SharedPreferences prefs;
  Api(this.prefs);

  String get serverUrl => (prefs.getString(_serverKey) ?? defaultServerUrl).replaceAll(RegExp(r'/+$'), '');
  Future<void> setServerUrl(String url) => prefs.setString(_serverKey, url.trim());

  String siteUrl(String route) => '${siteBaseUrl.isNotEmpty ? siteBaseUrl.replaceAll(RegExp(r'/+$'), '') : serverUrl}/#$route';

  String? get token => prefs.getString(_tokenKey);
  Future<void> setToken(String? t) => t == null ? prefs.remove(_tokenKey) : prefs.setString(_tokenKey, t);

  Future<Map<String, dynamic>> call(String path, {String? method, Object? body}) async {
    final uri = Uri.parse('$serverUrl/api$path');
    final headers = {
      if (body != null) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final m = method ?? (body != null ? 'POST' : 'GET');
    http.Response res;
    try {
      final req = http.Request(m, uri)..headers.addAll(headers);
      if (body != null) req.body = jsonEncode(body);
      // Generous timeout: a sleeping Render instance can take close to a minute to wake up.
      res = await http.Response.fromStream(await req.send().timeout(const Duration(seconds: 75)));
    } on TimeoutException {
      throw ApiError('The server took too long to answer. It may be waking up; try again in a moment.', 0);
    } catch (_) {
      throw ApiError('Cannot reach the server. Check your connection and the server address in Settings.', 0);
    }
    Map<String, dynamic> data;
    try {
      final decoded = jsonDecode(utf8.decode(res.bodyBytes));
      data = decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    } catch (_) {
      data = {};
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiError(data['error'] as String? ?? 'Request failed (${res.statusCode}).', res.statusCode);
    }
    return data;
  }
}
