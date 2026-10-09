@exercise gen-q-sample
lesson: diffusion
title: The diffusion forward process
packages: numpy
--- prompt
With a linear schedule `betas = np.linspace(1e-4, 0.02, T)`, write:

- `alpha_bars(betas)`: the cumulative products \(\bar\alpha_t=\prod_{s\le t}(1-\beta_s)\).
- `q_sample(x0, t, eps, abar)`: \(\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon\).
--- starter
import numpy as np

def alpha_bars(betas):
    raise NotImplementedError

def q_sample(x0, t, eps, abar):
    raise NotImplementedError
--- solution
import numpy as np

def alpha_bars(betas):
    return np.cumprod(1.0 - betas)

def q_sample(x0, t, eps, abar):
    return np.sqrt(abar[t]) * x0 + np.sqrt(1.0 - abar[t]) * eps
--- tests
import numpy as np
betas = np.linspace(1e-4, 0.02, 1000)
ab = alpha_bars(betas)
assert ab.shape == (1000,) and np.all(np.diff(ab) < 0), "alpha bar must decrease over time"
assert np.isclose(ab[0], 1 - 1e-4), "the first value is 1 - beta_0"
assert ab[-1] < 1e-3, "by the last step almost no signal remains"
x0 = np.ones(4); eps = np.zeros(4)
assert np.allclose(q_sample(x0, 0, eps, ab), np.sqrt(ab[0])), "with zero noise the sample is the scaled input"
rng = np.random.default_rng(0)
xs = q_sample(np.ones(200_000), 999, rng.normal(size=200_000), ab)
assert abs(xs.std() - 1.0) < 0.02, "at the final step samples are nearly standard normal"
