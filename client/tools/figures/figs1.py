"""Math and classical-ML figures."""
import math
import numpy as np
from fig_lib import F, P, fmt, Phi

rng = np.random.default_rng(7)


def vectors():
    f = F('vectors', 440, 290, 'Two vectors, the angle between them, and a projection')
    O = (70, 240); s = 52
    def pt(a, b): return (O[0] + a * s, O[1] - b * s)
    for i in range(0, 7):
        f.line(O[0] + i * s, 30, O[0] + i * s, O[1], 'grid')
    for j in range(0, 5):
        f.line(O[0], O[1] - j * s, O[0] + 6 * s, O[1] - j * s, 'grid')
    x = np.array([5.0, 0.4]); y = np.array([1.0, 3.6])
    pr = (x @ y) / (y @ y) * y
    X, Y, PR = pt(*x), pt(*y), pt(*pr)
    f.line(X[0], X[1], PR[0], PR[1], 'ln dash')
    f.line(*O, *Y, 'lna', 'a')
    f.line(*O, *PR, 'lc3 thick')
    f.line(*O, *X, 'lc2', 'c2')
    a1, a2 = math.atan2(x[1], x[0]), math.atan2(y[1], y[0])
    r = 42
    p1 = (O[0] + r * math.cos(a1), O[1] - r * math.sin(a1)); p2 = (O[0] + r * math.cos(a2), O[1] - r * math.sin(a2))
    f.path(f'M{p1[0]:.1f},{p1[1]:.1f} A{r},{r} 0 0 0 {p2[0]:.1f},{p2[1]:.1f}', 'ln')
    am = (a1 + a2) / 2
    f.text(O[0] + 58 * math.cos(am), O[1] - 58 * math.sin(am), 'θ', 'b')
    f.text(X[0] + 14, X[1] + 2, 'x', 'b tc2', anchor='start')
    f.text(Y[0] - 6, Y[1] - 12, 'y', 'b acc')
    f.text(PR[0] - 14, PR[1] + 14, 'proj_y x', 'sm tc3', anchor='end')
    f.text(O[0], O[1] + 18, '0', 'sm mut')
    f.text(300, 40, 'x·y = ‖x‖‖y‖ cos θ', 'sm')
    f.done()


def svd_geom():
    f = F('svd_geom', 480, 440, 'SVD as rotate, stretch, rotate')
    panels = [(10, 10, '1. Input: unit circle'), (250, 10, '2. Vᵀ rotates'),
              (10, 225, '3. Σ stretches axes'), (250, 225, '4. U rotates')]
    for (x, y, t) in panels:
        f.rect(x, y, 220, 205, 'pnl', 12)
        f.text(x + 110, y + 20, t, 'sm b')
    def vec(cx, cy, ang, ln, cls, mk):
        a = math.radians(ang)
        f.line(cx, cy, cx + ln * math.cos(a), cy - ln * math.sin(a), cls, mk)
    # panel 1
    cx, cy = 120, 125
    f.circ(cx, cy, 55, 'shape'); vec(cx, cy, 30, 55, 'lna', 'a'); vec(cx, cy, 120, 55, 'lc2', 'c2')
    cx, cy = 360, 125
    f.circ(cx, cy, 55, 'shape'); vec(cx, cy, 0, 55, 'lna', 'a'); vec(cx, cy, 90, 55, 'lc2', 'c2')
    cx, cy = 120, 340
    f.add(f'<ellipse cx="{cx}" cy="{cy}" rx="88" ry="30" class="shape"/>')
    vec(cx, cy, 0, 88, 'lna', 'a'); vec(cx, cy, 90, 30, 'lc2', 'c2')
    f.text(cx + 50, cy + 48, 'σ₁ = 1.6,  σ₂ = 0.55', 'xs mut')
    cx, cy = 360, 340
    f.add(f'<ellipse cx="{cx}" cy="{cy}" rx="88" ry="30" class="shape" transform="rotate(-25 {cx} {cy})"/>')
    vec(cx, cy, 25, 88, 'lna', 'a'); vec(cx, cy, 115, 30, 'lc2', 'c2')
    f.done()


def contour_gd():
    f = P('contour_gd', 480, 340, 'Gradient descent zig-zags on an ill-conditioned bowl; momentum smooths it',
          (-1.2, 1.2), (-0.8, 0.8))
    f.axes([-1, 0, 1], [-0.5, 0, 0.5], 'θ₁', 'θ₂')
    sx = (f.X(1) - f.X(0)); sy = (f.Y(0) - f.Y(1))
    for c in [0.02, 0.08, 0.2, 0.4, 0.7, 1.1, 1.6, 2.3]:
        a, b = math.sqrt(c), math.sqrt(c / 10)
        f.add(f'<ellipse cx="{f.X(0):.1f}" cy="{f.Y(0):.1f}" rx="{a * sx:.1f}" ry="{b * sy:.1f}" class="cont" clip-path="url(#contour_gd-clip)"/>')
    H = np.array([1.0, 10.0])
    th = np.array([-1.1, 0.55]); P1 = [th.copy()]
    for _ in range(25):
        th = th - 0.18 * H * th; P1.append(th.copy())
    th = np.array([-1.1, 0.55]); v = np.zeros(2); P2 = [th.copy()]
    for _ in range(40):
        v = 0.8 * v + H * th; th = th - 0.035 * v; P2.append(th.copy())
    P1 = np.array(P1); P2 = np.array(P2)
    f.curve(P1[:, 0], P1[:, 1], 's5'); f.dots(P1[:, 0], P1[:, 1], 'f5', 2.6)
    f.curve(P2[:, 0], P2[:, 1], 's3'); f.dots(P2[:, 0], P2[:, 1], 'f3', 2.6)
    f.text(f.X(0), f.Y(0), '★', 'acc', fs=16)
    f.legend([('s5', 'Gradient descent (η = 0.18)'), ('s3', 'Momentum (β = 0.8)')], 70, 34)
    f.done()


def gd_lr():
    f = P('gd_lr', 480, 320, 'Gradient descent on a parabola with three learning rates', (-3.2, 3.2), (0, 7.2))
    f.axes([-3, -2, -1, 0, 1, 2, 3], [0, 2, 4, 6], 'θ', 'loss')
    xs = np.linspace(-3.2, 3.2, 200); f.curve(xs, 0.5 * xs ** 2, 'sm1')
    for lr, cls, fc, n in [(0.15, 's3', 'f3', 8), (0.75, 's1', 'f1', 5), (2.05, 's5', 'f5', 4)]:
        t = -2.6; xs_, ys_ = [t], [0.5 * t * t]
        for _ in range(n):
            t = t - lr * t; xs_.append(t); ys_.append(0.5 * t * t)
        f.curve(xs_, ys_, cls); f.dots(xs_, ys_, fc, 3.2)
    f.legend([('s3', 'η = 0.15: slow'), ('s1', 'η = 0.75: good'), ('s5', 'η = 2.05: diverges')], 290, 26)
    f.done()


def lr_schedule():
    f = P('lr_schedule', 480, 280, 'Linear warmup followed by cosine decay', (0, 100), (0, 1.08))
    f.axes([0, 20, 40, 60, 80, 100], [0, 0.5, 1], 'training step (%)', 'learning rate / max')
    t = np.linspace(0, 100, 300)
    lr = np.where(t < 8, t / 8, 0.05 + 0.5 * 0.95 * (1 + np.cos(np.pi * (t - 8) / 92)))
    f.add(f'<rect x="{f.X(0):.1f}" y="{f.T}" width="{f.X(8) - f.X(0):.1f}" height="{f.h - f.T - f.B}" class="shade"/>')
    f.curve(t, lr, 's1')
    f.text(f.X(4), f.Y(0.25), 'warmup', 'xs mut', rot=-90)
    f.text(f.X(60), f.Y(0.62), 'cosine decay', 'sm mut')
    f.done()


def gaussians():
    f = P('gaussians', 480, 290, 'Gaussian densities with different means and variances', (-5, 6), (0, 0.85))
    f.axes([-4, -2, 0, 2, 4, 6], [0, 0.2, 0.4, 0.6, 0.8], 'x', 'density')
    xs = np.linspace(-5, 6, 400)
    def n(m, s): return np.exp(-(xs - m) ** 2 / (2 * s * s)) / (s * math.sqrt(2 * math.pi))
    for (m, s, c) in [(0, 0.5, 's1'), (0, 1, 's2'), (0, 2, 's3'), (2.5, 1, 's4')]:
        f.curve(xs, n(m, s), c)
    f.legend([('s1', 'μ=0, σ=0.5'), ('s2', 'μ=0, σ=1'), ('s3', 'μ=0, σ=2'), ('s4', 'μ=2.5, σ=1')], 360, 30)
    f.done()


def entropy_bin():
    f = P('entropy_bin', 440, 270, 'Binary entropy is highest when outcomes are equally likely', (0, 1), (0, 1.1))
    f.axes([0, 0.25, 0.5, 0.75, 1], [0, 0.5, 1], 'p = P(heads)', 'H(p) in bits')
    p = np.linspace(1e-4, 1 - 1e-4, 300)
    f.curve(p, -(p * np.log2(p) + (1 - p) * np.log2(1 - p)), 's1')
    f.dots([0.5], [1], 'f1', 4.5); f.text(f.X(0.5), f.Y(1) - 14, 'max: 1 bit (fair coin)', 'sm')
    f.done()


def lbeta(a, b): return math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)


def bayes_update():
    f = P('bayes_update', 480, 290, 'Prior times likelihood gives the posterior', (0, 1), (0, 4.0))
    f.axes([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 1, 2, 3, 4], 'coin bias p', 'density')
    p = np.linspace(1e-3, 1 - 1e-3, 300)
    def beta(a, b): return np.exp((a - 1) * np.log(p) + (b - 1) * np.log(1 - p) - lbeta(a, b))
    f.curve(p, beta(2, 2), 's2', dash=True); f.curve(p, beta(9, 3), 's4'); f.curve(p, beta(10, 4), 's1')
    f.legend([('s2 dash', 'prior Beta(2,2)'), ('s4', 'likelihood: 8 heads / 10 (scaled)'), ('s1', 'posterior Beta(10,4)')], 64, 30)
    f.done()


def loss_curves():
    f = P('loss_curves', 480, 290, 'Training vs validation loss: where to stop', (0, 100), (0, 2.5))
    f.axes([0, 20, 40, 60, 80, 100], [0, 0.5, 1, 1.5, 2, 2.5], 'epoch', 'loss')
    x = np.linspace(0, 100, 300)
    tr = 0.15 + 2.1 * np.exp(-x / 18); va = 0.5 + 1.9 * np.exp(-x / 14) + 0.00012 * x ** 2
    f.curve(x, tr, 's1'); f.curve(x, va, 's2')
    i = np.argmin(va); f.line(f.X(x[i]), f.T, f.X(x[i]), f.h - f.B, 'ln dash')
    f.text(f.X(x[i]) + 6, f.Y(2.35), 'early stopping', 'sm', anchor='start')
    f.text(f.X(15), f.Y(0.25), 'underfitting', 'xs mut'); f.text(f.X(80), f.Y(0.25), 'overfitting', 'xs mut')
    f.legend([('s1', 'training loss'), ('s2', 'validation loss')], 330, 50)
    f.done()


def bias_variance():
    f = P('bias_variance', 480, 290, 'The bias–variance trade-off', (0, 10), (0, 1.6))
    f.axes([], [], 'model complexity →', 'error')
    x = np.linspace(0, 10, 300)
    b = 1.2 * np.exp(-0.45 * x) + 0.02; v = 0.02 * np.exp(0.33 * x); n = 0.15 + 0 * x
    tot = b + v + n
    f.curve(x, b, 's1'); f.curve(x, v, 's2'); f.curve(x, n, 'sm1', dash=True); f.curve(x, tot, 's5')
    i = np.argmin(tot); f.dots([x[i]], [tot[i]], 'f5', 5)
    f.text(f.X(x[i]), f.Y(tot[i]) - 16, 'sweet spot', 'sm')
    f.legend([('s5', 'total error'), ('s1', 'bias²'), ('s2', 'variance'), ('sm1 dash', 'noise σ²')], 160, 30)
    f.done()


def kfold():
    f = F('kfold', 480, 270, '5-fold cross-validation')
    for r in range(5):
        y = 24 + r * 42
        f.text(48, y + 15, f'Fold {r + 1}', 'sm', anchor='end')
        for c in range(5):
            cls = 'b2' if c == r else 'bacc'
            f.rect(60 + c * 66, y, 62, 30, cls, 5)
        f.text(400, y + 15, f'score s{"₁₂₃₄₅"[r]}', 'sm', anchor='start')
    f.rect(60, 252 - 6, 14, 12, 'bacc', 2); f.text(80, 252, 'train', 'xs', anchor='start')
    f.rect(130, 252 - 6, 14, 12, 'b2', 2); f.text(150, 252, 'validate', 'xs', anchor='start')
    f.text(330, 252, 'CV score = mean of sᵢ', 'xs mut')
    f.done()


def linreg_proj():
    f = F('linreg_proj', 460, 270, 'Least squares projects y onto the column space of X')
    f.poly([(40, 210), (290, 250), (420, 170), (170, 130)], 'plane')
    f.text(355, 218, 'col(X)', 'sm mut')
    O = (150, 200); Yp = (300, 40); Pp = (300, 172)
    f.line(*O, *Pp, 'lc3 thick', 'c3')
    f.line(*O, *Yp, 'lna', 'a')
    f.line(*Yp, *Pp, 'lc5 dash', 'c5')
    f.path(f'M{Pp[0] - 12},{Pp[1] - 2} L{Pp[0] - 12},{Pp[1] - 14} L{Pp[0]},{Pp[1] - 14}', 'ln')
    f.text(Yp[0] + 10, Yp[1], 'y', 'b acc', anchor='start')
    f.text(232, 196, 'ŷ = Xŵ', 'sm tc3')
    f.text(310, 110, 'r = y − ŷ', 'sm tc5', anchor='start')
    f.text(310, 128, '⟂ col(X)', 'sm tc5', anchor='start')
    f.done()


def logistic_boundary():
    f = P('logistic_boundary', 420, 400, 'Logistic regression: a linear boundary with probability bands',
          (-4, 4), (-4, 4), pad=(40, 14, 14, 36))
    f.axes([-4, -2, 0, 2, 4], [-4, -2, 0, 2, 4], 'x₁', 'x₂')
    a = rng.normal([-1.4, -1.4], 0.9, (45, 2)); b = rng.normal([1.4, 1.4], 0.9, (45, 2))
    xs = np.linspace(-4, 4, 10)
    for c, cls, dash in [(0, 'sm1', False), (2.2, 'sm1', True), (-2.2, 'sm1', True)]:
        f.curve(xs, c - xs, cls, dash)
    f.dots(a[:, 0], a[:, 1], 'f2', 3.4); f.dots(b[:, 0], b[:, 1], 'f1', 3.4)
    f.text(f.X(-3.0), f.Y(3.6), 'p = 0.5', 'sm', anchor='start')
    f.text(f.X(-0.8), f.Y(3.6), 'p = 0.9', 'xs mut', anchor='start')
    f.text(f.X(-3.9), f.Y(2.5), 'p = 0.1', 'xs mut', anchor='start')
    f.done()


def svm_margin():
    f = P('svm_margin', 420, 470, 'Maximum-margin separating hyperplane', (0, 10), (0, 10), pad=(30, 14, 14, 100))
    f.axes([], [])
    xs = np.linspace(0, 10, 10)
    f.curve(xs, 10 - xs, 'sm1'); f.curve(xs, 8.5 - xs, 'sm1', True); f.curve(xs, 11.5 - xs, 'sm1', True)
    A = [(3, 5.5), (5, 3.5), (1.5, 3), (2.5, 1.5), (1, 5.5), (4, 2), (0.8, 1.2), (2.2, 4.3), (5.5, 1.2)]
    B = [(5, 6.5), (7, 4.5), (8, 7), (6.5, 8.5), (9, 5.5), (8.8, 8.8), (5.5, 9), (9.3, 3.5), (7.5, 6)]
    f.dots([p[0] for p in A], [p[1] for p in A], 'f2', 4.5)
    f.dots([p[0] for p in B], [p[1] for p in B], 'f1', 4.5)
    for p in [A[0], A[1], B[0], B[1]]:
        f.circ(f.X(p[0]), f.Y(p[1]), 9, 'ring')
    f.line(f.X(4.25), f.Y(4.25), f.X(5.75), f.Y(5.75), 'lc5', 'c5')
    f.line(f.X(5.75), f.Y(5.75), f.X(4.25), f.Y(4.25), 'lc5', 'c5')
    for k, (t, c) in enumerate([('solid: wᵀx + b = 0', 'xs'), ('dashed: wᵀx + b = ±1', 'xs'), ('circled: support vectors', 'xs'), ('red: margin = 2/‖w‖', 'xs tc5')]):
        f.text(40 + (k % 2) * 190, f.h - 66 + (k // 2) * 26, t, c, anchor='start')
    f.done()


def tree():
    f = F('tree', 500, 270, 'A small decision tree')
    f.rect(165, 16, 170, 48, 'bacc', 10, 'income > 50k?', '', 'Gini = 0.48')
    f.rect(40, 116, 170, 48, 'bacc', 10, 'age < 30?', '', 'Gini = 0.32')
    f.rect(300, 116, 170, 48, 'b5', 10, 'Reject', '', 'p(default) = 0.85')
    f.rect(10, 214, 140, 46, 'b3', 10, 'Approve', '', 'p = 0.72')
    f.rect(170, 214, 140, 46, 'b3', 10, 'Approve', '', 'p = 0.91')
    f.line(250, 64, 125, 116, 'ln', 'm'); f.line(250, 64, 385, 116, 'ln', 'm')
    f.line(125, 164, 80, 214, 'ln', 'm'); f.line(125, 164, 240, 214, 'ln', 'm')
    f.text(172, 84, 'yes', 'xs mut'); f.text(330, 84, 'no', 'xs mut')
    f.text(88, 186, 'yes', 'xs mut'); f.text(196, 186, 'no', 'xs mut')
    f.done()


def boosting():
    x = np.sort(rng.uniform(0, 10, 70)); y = np.sin(x) + rng.normal(0, 0.25, 70)
    grid = np.linspace(0, 10, 400)
    def stump(xx, r):
        best = None
        for t in (xx[1:] + xx[:-1]) / 2:
            L, R = r[xx <= t], r[xx > t]
            sse = ((L - L.mean()) ** 2).sum() + ((R - R.mean()) ** 2).sum()
            if best is None or sse < best[0]:
                best = (sse, t, L.mean(), R.mean())
        return best[1:]
    F_tr = np.zeros_like(y); F_g = np.zeros_like(grid); snaps = {}
    for m in range(1, 51):
        t, l, r = stump(x, y - F_tr)
        F_tr += 0.3 * np.where(x <= t, l, r); F_g += 0.3 * np.where(grid <= t, l, r)
        if m in (1, 5, 50):
            snaps[m] = F_g.copy()
    f = P('boosting', 480, 290, 'Gradient boosting with decision stumps after 1, 5 and 50 rounds', (0, 10), (-1.8, 1.8))
    f.axes([0, 2, 4, 6, 8, 10], [-1, 0, 1], 'x', 'y')
    f.dots(x, y, 'fm', 2.6)
    f.curve(grid, snaps[1], 's2'); f.curve(grid, snaps[5], 's4'); f.curve(grid, snaps[50], 's1')
    f.legend([('s2', 'm = 1'), ('s4', 'm = 5'), ('s1', 'm = 50')], 380, 30)
    f.done()


def pca():
    C = np.array([[3, 1.6], [1.6, 1.2]]); Xd = rng.multivariate_normal([0, 0], C, 220)
    lam, V = np.linalg.eigh(np.cov(Xd.T)); order = lam.argsort()[::-1]; lam, V = lam[order], V[:, order]
    f = P('pca', 460, 340, 'Principal components point along directions of maximum variance', (-5, 5), (-3.5, 3.5))
    f.axes([-4, -2, 0, 2, 4], [-2, 0, 2], 'x₁', 'x₂')
    f.dots(Xd[:, 0], Xd[:, 1], 'fm', 2.4)
    mu = Xd.mean(0)
    for k, (cls, mk, lab) in enumerate([('lna thick', 'a', 'PC1'), ('lc2 thick', 'c2', 'PC2')]):
        e = mu + 2 * math.sqrt(lam[k]) * V[:, k]
        f.line(f.X(mu[0]), f.Y(mu[1]), f.X(e[0]), f.Y(e[1]), cls, mk)
        f.text(f.X(e[0]) + 14 * (1 if V[0, k] > 0 else -1), f.Y(e[1]) - 10, lab, 'b ' + ('acc' if k == 0 else 'tc2'))
    f.text(f.X(2.2), f.Y(-2.9), f'explained: {lam[0] / lam.sum():.0%} / {lam[1] / lam.sum():.0%}', 'sm mut')
    f.done()


def roc():
    f = P('roc', 400, 400, 'ROC curves for a strong, a weak and a random classifier', (0, 1), (0, 1), pad=(48, 14, 14, 42))
    f.axes([0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1], 'false positive rate', 'true positive rate')
    t = np.linspace(-6, 8, 400)
    for mu, cls in [(2.0, 's1'), (0.8, 's2')]:
        fpr = np.array([1 - Phi(v) for v in t]); tpr = np.array([1 - Phi(v - mu) for v in t])
        f.curve(fpr, tpr, cls)
    f.curve([0, 1], [0, 1], 'sm1', dash=True)
    f.legend([('s1', f'strong (AUC ≈ {Phi(2 / math.sqrt(2)):.2f})'), ('s2', f'weak (AUC ≈ {Phi(0.8 / math.sqrt(2)):.2f})'),
              ('sm1 dash', 'random (AUC = 0.5)')], 150, 300)
    f.done()


def confusion():
    f = F('confusion', 460, 272, 'Confusion matrix and the metrics read from it')
    x0, y0, c = 130, 50, 110
    f.text(x0 + c / 2, y0 - 16, 'Predicted +', 'sm b'); f.text(x0 + 1.5 * c, y0 - 16, 'Predicted −', 'sm b')
    f.text(x0 - 10, y0 + c / 4 + 14, 'Actual +', 'sm b', anchor='end'); f.text(x0 - 10, y0 + 0.75 * c + 14, 'Actual −', 'sm b', anchor='end')
    h = c * 0.8
    f.rect(x0, y0, c, h, 'b3', 4, 'TP', 'b'); f.rect(x0 + c, y0, c, h, 'b5', 4, 'FN', 'b')
    f.rect(x0, y0 + h, c, h, 'b5', 4, 'FP', 'b'); f.rect(x0 + c, y0 + h, c, h, 'b3', 4, 'TN', 'b')
    f.text(x0 + c + 2, y0 + 2 * h + 20, 'precision = TP / (TP + FP)  ·  recall = TP / (TP + FN)', 'sm mut')
    f.done()


def ab_power():
    f = P('ab_power', 480, 280, 'Significance level and power in a hypothesis test', (-3.5, 6), (0, 0.45))
    f.axes([-2, 0, 2, 4, 6], [], 'test statistic z', None)
    x = np.linspace(-3.5, 6, 400)
    n0 = np.exp(-x ** 2 / 2) / math.sqrt(2 * math.pi); n1 = np.exp(-(x - 2.8) ** 2 / 2) / math.sqrt(2 * math.pi)
    m = x >= 1.96
    f.area(x[m], 0 * x[m], n1[m], 'a3'); f.area(x[m], 0 * x[m], n0[m], 'a5')
    f.curve(x, n0, 's1'); f.curve(x, n1, 's2')
    f.line(f.X(1.96), f.T, f.X(1.96), f.h - f.B, 'ln dash')
    f.text(f.X(1.9), f.Y(0.44), 'critical value 1.96', 'xs', anchor='end')
    f.text(f.X(-1.9), f.Y(0.33), 'H₀: no effect', 'sm tc1'); f.text(f.X(4.8), f.Y(0.3), 'H₁: true effect', 'sm tc2')
    f.text(f.X(3.3), f.Y(0.12), 'power', 'sm tc3'); f.text(f.X(2.45), f.Y(0.025), 'α', 'sm tc5')
    f.done()


def gp():
    Xo = np.array([0.8, 2.2, 3.5, 5.1, 7.4, 8.6]); yo = np.sin(Xo) + 0.3 * np.cos(2 * Xo)
    xs = np.linspace(0, 10, 220)
    def k(a, b): return np.exp(-0.5 * (a[:, None] - b[None, :]) ** 2 / 1.0)
    K = k(Xo, Xo) + 1e-3 * np.eye(len(Xo)); Ks = k(xs, Xo); Kss = k(xs, xs)
    Ki = np.linalg.inv(K); mu = Ks @ Ki @ yo; cov = Kss - Ks @ Ki @ Ks.T
    sd = np.sqrt(np.clip(np.diag(cov), 0, None))
    f = P('gp', 480, 290, 'Gaussian process regression: mean, uncertainty band and posterior samples', (0, 10), (-3, 3))
    f.axes([0, 2, 4, 6, 8, 10], [-2, 0, 2], 'x', 'f(x)')
    f.area(xs, mu - 2 * sd, mu + 2 * sd, 'a1')
    L = np.linalg.cholesky(cov + 1e-6 * np.eye(len(xs)))
    for i in range(3):
        f.curve(xs, mu + L @ rng.normal(size=len(xs)), 'sthin')
    f.curve(xs, mu, 's1'); f.dots(Xo, yo, 'f5', 4.5)
    f.legend([('s1', 'posterior mean'), ('a1', ''), ('sthin', 'posterior samples'), ('f5', 'observations')], 330, 30, 18)
    f.done()


def timeseries():
    t = np.arange(0, 130); trend = 0.03 * t; season = np.sin(2 * np.pi * t / 24)
    y = 2 + trend + season + rng.normal(0, 0.25, len(t))
    f = P('timeseries', 480, 280, 'A forecast with a widening prediction interval', (0, 130), (0, 8))
    f.axes([0, 24, 48, 72, 96, 120], [0, 2, 4, 6, 8], 'time (hours)', 'demand')
    h = t[:100]; fc = t[99:]
    f.curve(h, y[:100], 's1')
    mean = 2 + 0.03 * fc + np.sin(2 * np.pi * fc / 24); w = 0.35 + 0.025 * (fc - 99)
    f.area(fc, mean - 1.96 * w, mean + 1.96 * w, 'a2'); f.curve(fc, mean, 's2', dash=True)
    f.line(f.X(99), f.T, f.X(99), f.h - f.B, 'ln dash'); f.text(f.X(99) + 4, f.T + 10, 'now', 'xs', anchor='start')
    f.legend([('s1', 'history'), ('s2 dash', 'forecast ± 95% interval')], 70, 30)
    f.done()


def causal_dag():
    f = F('causal_dag', 420, 230, 'A confounder Z affects both treatment T and outcome Y')
    f.circ(210, 50, 30, 'node n2', 'Z', 'b'); f.circ(80, 180, 30, 'node', 'T', 'b'); f.circ(340, 180, 30, 'node n3', 'Y', 'b')
    f.line(190, 73, 102, 158, 'ln', 'm'); f.line(230, 73, 318, 158, 'ln', 'm'); f.line(112, 180, 306, 180, 'lna', 'a')
    f.text(210, 166, 'causal effect?', 'sm acc'); f.text(210, 14, 'confounder (e.g. age)', 'xs mut')
    f.text(80, 222, 'treatment', 'xs mut'); f.text(340, 222, 'outcome', 'xs mut')
    f.done()


def ALL():
    for fn in [vectors, svd_geom, contour_gd, gd_lr, lr_schedule, gaussians, entropy_bin, bayes_update,
               loss_curves, bias_variance, kfold, linreg_proj, logistic_boundary, svm_margin, tree, boosting,
               pca, roc, confusion, ab_power, gp, timeseries, causal_dag]:
        fn()
