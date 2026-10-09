import html, math
import numpy as np

FIGS = {}
MK = ['m', 'a', 'c2', 'c3', 'c4', 'c5']


def esc(t):
    return html.escape(str(t), quote=True)


def fmt(v):
    if abs(v - round(v)) < 1e-9:
        return str(int(round(v)))
    return f'{v:g}'


class F:
    def __init__(s, name, w, h, label=''):
        s.n, s.w, s.h, s.label = name, w, h, label
        s.e = []

    def add(s, x):
        s.e.append(x)
        return s

    def text(s, x, y, t, cls='', anchor='middle', fs=None, rot=None):
        a = f' font-size="{fs}"' if fs else ''
        r = f' transform="rotate({rot} {x:.1f} {y:.1f})"' if rot is not None else ''
        c = f' class="{cls}"' if cls else ''
        s.add(f'<text x="{x:.1f}" y="{y:.1f}" dy="0.35em" text-anchor="{anchor}"{c}{a}{r}>{esc(t)}</text>')
        return s

    def rect(s, x, y, w, h, cls='box', rx=8, t=None, tcls='', t2=None, fs=None, op=None, t2cls='sm mut'):
        o = f' opacity="{op:.3f}"' if op is not None else ''
        s.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" class="{cls}"{o}/>')
        if t is not None:
            if t2 is None:
                s.text(x + w / 2, y + h / 2, t, tcls, fs=fs)
            else:
                s.text(x + w / 2, y + h / 2 - 9, t, tcls, fs=fs)
                s.text(x + w / 2, y + h / 2 + 11, t2, t2cls)
        return s

    def circ(s, cx, cy, r, cls='node', t=None, tcls='', fs=None, op=None):
        o = f' opacity="{op:.3f}"' if op is not None else ''
        s.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" class="{cls}"{o}/>')
        if t is not None:
            s.text(cx, cy, t, tcls, fs=fs)
        return s

    def line(s, x1, y1, x2, y2, cls='ln', arr=None):
        m = f' marker-end="url(#{s.n}-{arr})"' if arr else ''
        s.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="{cls}"{m}/>')
        return s

    def path(s, d, cls='ln', arr=None, extra=''):
        m = f' marker-end="url(#{s.n}-{arr})"' if arr else ''
        s.add(f'<path d="{d}" class="{cls}"{m}{extra}/>')
        return s

    def poly(s, pts, cls='box'):
        p = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
        s.add(f'<polygon points="{p}" class="{cls}"/>')
        return s

    def arrow(s, x1, y1, x2, y2, cls='ln', arr='m'):
        return s.line(x1, y1, x2, y2, cls, arr)

    def svg(s):
        mk = ''.join(
            f'<marker id="{s.n}-{k}" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="9" markerHeight="9" '
            f'markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-{k}"/></marker>'
            for k in MK)
        return (f'<svg class="fsvg" viewBox="0 0 {s.w} {s.h}" role="img" aria-label="{esc(s.label)}" '
                f'style="--fw:{s.w}px"><defs>{mk}</defs>' + ''.join(s.e) + '</svg>')

    def done(s):
        FIGS[s.n] = s.svg()
        return s


class P(F):
    def __init__(s, name, w, h, label, xr, yr, pad=(52, 18, 18, 44)):
        super().__init__(name, w, h, label)
        s.xr, s.yr = xr, yr
        s.L, s.R, s.T, s.B = pad
        s.add(f'<clipPath id="{name}-clip"><rect x="{s.L}" y="{s.T}" width="{w - s.L - s.R}" height="{h - s.T - s.B}"/></clipPath>')

    def X(s, x):
        return s.L + (x - s.xr[0]) / (s.xr[1] - s.xr[0]) * (s.w - s.L - s.R)

    def Y(s, y):
        return s.h - s.B - (y - s.yr[0]) / (s.yr[1] - s.yr[0]) * (s.h - s.T - s.B)

    def axes(s, xt=(), yt=(), xl=None, yl=None, xf=fmt, yf=fmt, grid=True):
        x0, x1, y0, y1 = s.L, s.w - s.R, s.h - s.B, s.T
        for v in xt:
            X = s.X(v)
            if grid:
                s.line(X, y0, X, y1, 'grid')
            s.text(X, y0 + 14, xf(v), 'sm mut')
        for v in yt:
            Y = s.Y(v)
            if grid:
                s.line(x0, Y, x1, Y, 'grid')
            s.text(x0 - 7, Y, yf(v), 'sm mut', anchor='end')
        s.line(x0, y0, x1, y0, 'axis')
        s.line(x0, y0, x0, y1, 'axis')
        if xl:
            s.text((x0 + x1) / 2, s.h - 9, xl, 'sm mut')
        if yl:
            s.text(13, (y0 + y1) / 2, yl, 'sm mut', rot=-90)
        return s

    def pts(s, xs, ys):
        return ' '.join(f'{s.X(a):.1f},{s.Y(b):.1f}' for a, b in zip(xs, ys) if np.isfinite(b))

    def curve(s, xs, ys, cls='s1', dash=False):
        d = ' dash' if dash else ''
        s.add(f'<polyline points="{s.pts(xs, ys)}" class="{cls}{d}" clip-path="url(#{s.n}-clip)"/>')
        return s

    def area(s, xs, ylo, yhi, cls='a1'):
        p = [f'{s.X(a):.1f},{s.Y(b):.1f}' for a, b in zip(xs, yhi)] + \
            [f'{s.X(a):.1f},{s.Y(b):.1f}' for a, b in zip(xs[::-1], ylo[::-1])]
        s.add(f'<polygon points="{" ".join(p)}" class="{cls}" clip-path="url(#{s.n}-clip)"/>')
        return s

    def dots(s, xs, ys, cls='f1', r=3.6):
        for a, b in zip(xs, ys):
            s.add(f'<circle cx="{s.X(a):.1f}" cy="{s.Y(b):.1f}" r="{r}" class="{cls}"/>')
        return s

    def legend(s, items, x, y, dy=20):
        items = [it for it in items if it[1]]
        for i, (cls, lab) in enumerate(items):
            yy = y + i * dy
            if cls.startswith('f'):
                s.circ(x + 10, yy, 5, cls)
            else:
                s.line(x, yy, x + 22, yy, cls)
            s.text(x + 30, yy, lab, 'sm', anchor='start')
        return s


def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))
