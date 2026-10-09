@exercise sec-fgsm
lesson: adversarial-examples
title: FGSM against logistic regression
packages: numpy
--- prompt
For a logistic-regression model \(p=\sigma(\mathbf w^\top\mathbf x+b)\) with binary cross-entropy loss, the input gradient is \(\nabla_{\mathbf x}\mathcal L=(p-y)\,\mathbf w\). Write `fgsm(x, y, w, b, eps)` returning \(\mathbf x+\epsilon\,\mathrm{sign}(\nabla_{\mathbf x}\mathcal L)\).
--- starter
import numpy as np

def fgsm(x, y, w, b, eps):
    raise NotImplementedError
--- solution
import numpy as np

def fgsm(x, y, w, b, eps):
    p = 1.0 / (1.0 + np.exp(-(w @ x + b)))
    grad = (p - y) * w
    return x + eps * np.sign(grad)
--- tests
import numpy as np
rng = np.random.default_rng(0)
w = rng.normal(size=1000); b = 0.0
x = 0.02 * np.sign(w)            # a confident positive: score = 0.02 * ||w||_1
p = lambda v: 1 / (1 + np.exp(-(w @ v + b)))
assert p(x) > 0.99, "sanity check: the clean input is a confident positive"
x_adv = fgsm(x, 1, w, b, 0.03)
assert np.max(np.abs(x_adv - x)) <= 0.03 + 1e-12, "the perturbation must stay within eps in every coordinate"
assert p(x_adv) < 0.01, "an eps of 0.03 per feature should flip a 1000-dimensional linear model"
