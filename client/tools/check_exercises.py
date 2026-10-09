"""Verify every code exercise: the reference solution must pass its tests and the starter must fail them.

Usage:  python tools/check_exercises.py      (needs numpy for exercises that declare it)
"""
import glob, io, contextlib, os, re, sys, traceback

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def parse(path):
    text = open(path, encoding='utf-8').read()
    for chunk in re.split(r'^@exercise\s+', text, flags=re.M)[1:]:
        ex_id = chunk.split('\n', 1)[0].strip()
        parts = re.split(r'^--- (\w+)\s*$', chunk, flags=re.M)
        sections = {parts[i]: parts[i + 1].strip('\n') + '\n' for i in range(1, len(parts), 2)}
        yield ex_id, sections


def run(code, tests):
    ns = {'__name__': '__main__'}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(code, 'solution.py', 'exec'), ns)
            exec(compile(tests, 'tests.py', 'exec'), ns)
        return True, ''
    except Exception as e:  # noqa: BLE001
        return False, f'{type(e).__name__}: {e}'


bad = 0
total = 0
for path in sorted(glob.glob(os.path.join(ROOT, 'content', 'exercises', '*.ex'))):
    for ex_id, s in parse(path):
        total += 1
        ok, err = run(s['solution'], s['tests'])
        if not ok:
            bad += 1
            print(f'FAIL  {ex_id}: solution does not pass its tests -> {err}')
        ok2, _ = run(s['starter'], s['tests'])
        if ok2:
            bad += 1
            print(f'FAIL  {ex_id}: the starter code already passes the tests')
print(f'{total - bad if bad <= total else 0}/{total} exercises OK' if not bad else f'{bad} problem(s) in {total} exercises')
sys.exit(1 if bad else 0)
