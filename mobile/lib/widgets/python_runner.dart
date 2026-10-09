import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class RunResult {
  final bool ok;
  final String stage; // done | code | tests | runtime | timeout
  final String error;
  final String output;
  RunResult(this.ok, this.stage, this.error, this.output);
  factory RunResult.fromJson(Map<String, dynamic> j) => RunResult(j['ok'] == true, j['stage'] as String? ?? 'runtime', j['error'] as String? ?? '', j['output'] as String? ?? '');
}

enum RunnerState { idle, loading, ready, error }

/// Runs learner code with Pyodide (CPython in WebAssembly) in a Web Worker inside a hidden WebView,
/// the same way the website does (client/src/py/pyodide.worker.js).
class PythonRunner extends ChangeNotifier {
  static const _pyodide = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  static const _harness = r'''
import sys, io, json, traceback

def __tb():
    return "".join(l for l in traceback.format_exc().splitlines(True) if "<exec>" not in l)

def __run_exercise(user_code, test_code):
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    ns = {"__name__": "__main__"}
    result = {"ok": True, "stage": "done", "error": ""}
    try:
        exec(compile(user_code, "solution.py", "exec"), ns)
    except Exception:
        result = {"ok": False, "stage": "code", "error": __tb()}
    if result["ok"]:
        try:
            exec(compile(test_code, "tests.py", "exec"), ns)
        except AssertionError as e:
            result = {"ok": False, "stage": "tests", "error": str(e) or "A test failed."}
        except Exception:
            result = {"ok": False, "stage": "tests", "error": __tb()}
    sys.stdout = old
    result["output"] = buf.getvalue()[-4000:]
    return json.dumps(result)
''';

  late final WebViewController controller;
  RunnerState state = RunnerState.idle;
  String bootError = '';
  int _seq = 0;
  final _pending = <int, Completer<RunResult>>{};
  Completer<void>? _ready;

  PythonRunner() {
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('Runner', onMessageReceived: _onMessage);
  }

  String get _page {
    final worker = '''
importScripts('${_pyodide}pyodide.js');
let py = null; const loaded = new Set();
const ready = loadPyodide({ indexURL: '$_pyodide' }).then(p => { py = p; py.runPython(${jsonEncode(_harness)}); postMessage({type:'ready'}); },
  e => postMessage({type:'boot-error', error: String(e && e.message ? e.message : e)}));
onmessage = async (ev) => {
  const { id, code, tests, packages } = ev.data;
  try {
    await ready;
    if (!py) throw new Error('Python runtime is not available.');
    const need = (packages || []).filter(p => !loaded.has(p));
    if (need.length) { await py.loadPackage(need); need.forEach(p => loaded.add(p)); }
    py.globals.set('__user_code', code); py.globals.set('__test_code', tests);
    postMessage({ type: 'result', id, ...JSON.parse(py.runPython('__run_exercise(__user_code, __test_code)')) });
  } catch (e) { postMessage({ type: 'result', id, ok: false, stage: 'runtime', error: String(e && e.message ? e.message : e), output: '' }); }
};''';
    return '''<!doctype html><html><body><script>
const SRC = ${jsonEncode(worker)};
let w = null; const timers = {};
function send(m){ Runner.postMessage(JSON.stringify(m)); }
function spawn(){
  w = new Worker(URL.createObjectURL(new Blob([SRC], {type: 'text/javascript'})));
  w.onmessage = (e) => { const m = e.data; if (m.type === 'result') { clearTimeout(timers[m.id]); delete timers[m.id]; } send(m); };
  w.onerror = (e) => send({type:'boot-error', error: e.message || 'The Python worker failed to start.'});
}
function run(id, code, tests, packages, budget){
  if (!w) spawn();
  timers[id] = setTimeout(() => {
    w.terminate(); delete timers[id]; spawn();
    send({type:'result', id, ok:false, stage:'timeout', error:'Stopped after ' + Math.round(budget/1000) + ' seconds. Check for an infinite loop.', output:'', restarted:true});
  }, budget);
  w.postMessage({id, code, tests, packages});
}
spawn();
</script></body></html>''';
  }

  void _onMessage(JavaScriptMessage m) {
    final data = jsonDecode(m.message) as Map<String, dynamic>;
    switch (data['type']) {
      case 'ready':
        state = RunnerState.ready;
        _ready?.complete();
        notifyListeners();
      case 'boot-error':
        bootError = data['error'] as String? ?? 'unknown error';
        state = RunnerState.error;
        if (!(_ready?.isCompleted ?? true)) _ready!.completeError(bootError);
        notifyListeners();
      case 'result':
        if (data['restarted'] == true) {
          // The worker was killed; the next run boots a fresh one.
          state = RunnerState.loading;
          _ready = Completer<void>();
          notifyListeners();
        }
        _pending.remove((data['id'] as num).toInt())?.complete(RunResult.fromJson(data));
    }
  }

  /// Starts loading Python in the background (the first load downloads about 10 MB).
  Future<void> warmUp() {
    if (_ready != null && state != RunnerState.error) return _ready!.future;
    _ready = Completer<void>();
    _ready!.future.catchError((_) {});
    state = RunnerState.loading;
    notifyListeners();
    controller.loadHtmlString(_page, baseUrl: 'https://academy.local/');
    return _ready!.future;
  }

  Future<RunResult> run(String code, String tests, List<String> packages) async {
    try {
      await warmUp();
    } catch (_) {
      return RunResult(false, 'runtime', 'Python could not load: $bootError. It needs an internet connection the first time.', '');
    }
    final id = ++_seq;
    final c = Completer<RunResult>();
    _pending[id] = c;
    final budget = 15000 + (packages.isEmpty ? 0 : 25000);
    await controller.runJavaScript('run($id, ${jsonEncode(code)}, ${jsonEncode(tests)}, ${jsonEncode(packages)}, $budget)');
    return c.future;
  }
}

/// Keeps the runner's WebView alive in the widget tree (it must be attached to execute on Android).
class PythonHost extends StatelessWidget {
  final PythonRunner runner;
  const PythonHost(this.runner, {super.key});

  @override
  Widget build(BuildContext context) => SizedBox(width: 1, height: 1, child: Opacity(opacity: 0, child: WebViewWidget(controller: runner.controller)));
}
