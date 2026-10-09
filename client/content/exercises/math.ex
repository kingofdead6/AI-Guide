@exercise math-cosine
lesson: vectors
title: Cosine similarity from scratch
--- prompt
Write `cosine(a, b)` for two equal-length lists of numbers, without NumPy. Return `0.0` if either vector has zero length.
--- starter
import math

def cosine(a, b):
    # dot product / (norm(a) * norm(b))
    raise NotImplementedError
--- solution
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)
--- tests
import math
assert math.isclose(cosine([1, 0, 1], [0, 1, 1]), 0.5), "cosine of (1,0,1) and (0,1,1) is 0.5"
assert math.isclose(cosine([1, 2], [2, 4]), 1.0), "parallel vectors have cosine 1"
assert math.isclose(cosine([1, 0], [-1, 0]), -1.0), "opposite vectors have cosine -1"
assert cosine([0, 0], [1, 1]) == 0.0, "a zero vector should return 0.0, not raise"

@exercise math-softmax
lesson: numerics
title: A softmax that never overflows
--- prompt
Write `softmax(z)` for a list of floats. It must work for huge logits such as `[1000, 1001]`, where a naive `math.exp` overflows. Hint: subtract the maximum first; the result is unchanged.
--- starter
import math

def softmax(z):
    raise NotImplementedError
--- solution
import math

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]
--- tests
import math
p = softmax([1.0, 2.0, 3.0])
assert math.isclose(sum(p), 1.0), "probabilities must sum to 1"
assert math.isclose(p[2], 0.6652409557748219, rel_tol=1e-9), f"softmax([1,2,3])[2] should be about 0.6652, got {p[2]}"
big = softmax([1000.0, 1001.0])
assert math.isclose(big[1], 1 / (1 + math.exp(-1)), rel_tol=1e-9), "must handle large logits without overflow"
assert softmax([5.0]) == [1.0], "a single logit gives probability 1"

@exercise math-numgrad
lesson: matrix-calculus
title: Numerical gradient checker
--- prompt
Write `num_grad(f, x, eps=1e-5)` that returns the gradient of a scalar function `f` at the point `x` (a list of floats) using central differences:

$$\frac{\partial f}{\partial x_i}\approx\frac{f(x+\epsilon e_i)-f(x-\epsilon e_i)}{2\epsilon}$$

Do not modify the input list.
--- starter
def num_grad(f, x, eps=1e-5):
    grad = []
    # for each coordinate i: build x_plus and x_minus copies, apply the formula
    raise NotImplementedError
--- solution
def num_grad(f, x, eps=1e-5):
    grad = []
    for i in range(len(x)):
        xp = list(x); xm = list(x)
        xp[i] += eps; xm[i] -= eps
        grad.append((f(xp) - f(xm)) / (2 * eps))
    return grad
--- tests
import math
f = lambda v: v[0] ** 2 * v[1] + math.exp(v[0] * v[1])
x = [0.5, -1.0]
g = num_grad(f, x)
exact = [2 * 0.5 * -1.0 + -1.0 * math.exp(-0.5), 0.25 + 0.5 * math.exp(-0.5)]
assert all(math.isclose(a, b, rel_tol=1e-6) for a, b in zip(g, exact)), f"expected {exact}, got {g}"
assert x == [0.5, -1.0], "num_grad must not modify its input"

@exercise math-gd
lesson: optimization
title: Gradient descent on a bowl
--- prompt
Write `gd(grad, x0, lr, steps)` that runs plain gradient descent and returns the final point as a list. `grad(x)` returns the gradient as a list.

Then think about the tests: on \(f(x)=\tfrac12(x_1^2+10x_2^2)\) a learning rate of 0.15 converges, but 0.25 diverges. Why? (The stability limit is \(2/\lambda_{\max}=0.2\).)
--- starter
def gd(grad, x0, lr, steps):
    x = list(x0)
    raise NotImplementedError
--- solution
def gd(grad, x0, lr, steps):
    x = list(x0)
    for _ in range(steps):
        g = grad(x)
        x = [xi - lr * gi for xi, gi in zip(x, g)]
    return x
--- tests
grad = lambda x: [x[0], 10 * x[1]]
x = gd(grad, [1.0, 1.0], 0.15, 200)
assert abs(x[0]) < 1e-6 and abs(x[1]) < 1e-6, f"with lr=0.15 it should converge to (0, 0), got {x}"
y = gd(grad, [1.0, 1.0], 0.25, 50)
assert abs(y[1]) > 1e3, "with lr=0.25 > 2/10 the steep coordinate should blow up"

@exercise math-kl
lesson: info-theory
title: Entropy and KL divergence in bits
--- prompt
Write `entropy(p)` and `kl(p, q)` for discrete distributions given as lists, using base-2 logarithms. Terms with \(p_i=0\) contribute 0.
--- starter
import math

def entropy(p):
    raise NotImplementedError

def kl(p, q):
    raise NotImplementedError
--- solution
import math

def entropy(p):
    return -sum(pi * math.log2(pi) for pi in p if pi > 0)

def kl(p, q):
    return sum(pi * math.log2(pi / qi) for pi, qi in zip(p, q) if pi > 0)
--- tests
import math
assert math.isclose(entropy([0.5, 0.5]), 1.0), "a fair coin has 1 bit of entropy"
assert math.isclose(entropy([1.0, 0.0]), 0.0, abs_tol=1e-12), "a certain outcome has 0 entropy"
assert math.isclose(kl([0.5, 0.5], [0.25, 0.75]), 0.5 - 0.5 * math.log2(1.5)), "KL([.5,.5] || [.25,.75])"
assert kl([0.3, 0.7], [0.3, 0.7]) == 0, "KL of a distribution with itself is 0"
assert kl([0.9, 0.1], [0.5, 0.5]) != kl([0.5, 0.5], [0.9, 0.1]), "KL is not symmetric"
