/* Runs learner code in Pyodide (CPython compiled to WebAssembly) inside a worker,
   so an infinite loop can be stopped by terminating the worker. */
/* global importScripts, loadPyodide */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
let pyodide = null;
const loaded = new Set();

const HARNESS = `
import sys, io, json, traceback

def __tb():
    # Hide the harness's own frame so learners only see their code.
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
`;

async function boot() {
  importScripts(PYODIDE_URL + 'pyodide.js');
  pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  pyodide.runPython(HARNESS);
}

const ready = boot().then(
  () => postMessage({ type: 'ready' }),
  (e) => postMessage({ type: 'boot-error', error: String(e && e.message ? e.message : e) }),
);

onmessage = async (ev) => {
  const { id, code, tests, packages } = ev.data;
  try {
    await ready;
    if (!pyodide) throw new Error('Python runtime is not available.');
    const need = (packages || []).filter((p) => !loaded.has(p));
    if (need.length) {
      await pyodide.loadPackage(need);
      need.forEach((p) => loaded.add(p));
    }
    pyodide.globals.set('__user_code', code);
    pyodide.globals.set('__test_code', tests);
    const out = pyodide.runPython('__run_exercise(__user_code, __test_code)');
    postMessage({ type: 'result', id, ...JSON.parse(out) });
  } catch (e) {
    postMessage({ type: 'result', id, ok: false, stage: 'runtime', error: String(e && e.message ? e.message : e), output: '' });
  }
};
