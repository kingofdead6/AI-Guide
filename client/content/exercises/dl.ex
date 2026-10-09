@exercise dl-relu-backward
lesson: backprop
title: Backpropagate through a dense layer and ReLU
packages: numpy
--- prompt
For a batch `X` of shape `(B, d_in)`, weights `W` of shape `(d_in, d_out)` and bias `b`, the forward pass is `Z = X @ W + b` and `H = relu(Z)`. Given the upstream gradient `dH` (same shape as `H`), write `backward(X, W, Z, dH)` returning `(dX, dW, db)`.

Remember: the ReLU passes gradient only where `Z > 0`; the weight gradient is input-transposed times error signal; the bias gradient sums over the batch.
--- starter
import numpy as np

def backward(X, W, Z, dH):
    raise NotImplementedError
--- solution
import numpy as np

def backward(X, W, Z, dH):
    dZ = dH * (Z > 0)
    dW = X.T @ dZ
    db = dZ.sum(axis=0)
    dX = dZ @ W.T
    return dX, dW, db
--- tests
import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(size=(4, 3)); W = rng.normal(size=(3, 2)); b = rng.normal(size=2)
Z = X @ W + b
dH = rng.normal(size=(4, 2))
dX, dW, db = backward(X, W, Z, dH)
assert dX.shape == X.shape and dW.shape == W.shape and db.shape == b.shape, "gradients must match the shapes of X, W and b"
def loss(Wp):
    return float((np.maximum(0, X @ Wp + b) * dH).sum())
eps = 1e-6; num = np.zeros_like(W)
for i in range(W.shape[0]):
    for j in range(W.shape[1]):
        Wp = W.copy(); Wp[i, j] += eps; Wm = W.copy(); Wm[i, j] -= eps
        num[i, j] = (loss(Wp) - loss(Wm)) / (2 * eps)
assert np.allclose(dW, num, atol=1e-5), "dW does not match the numerical gradient"

@exercise dl-conv2d
lesson: cnn
title: A 2-D convolution by hand
--- prompt
Write `conv2d(image, kernel)` for lists of lists, with stride 1 and no padding ("valid" mode). Like deep learning libraries, compute cross-correlation: `out[i][j] = sum(image[i+m][j+n] * kernel[m][n])`. The output size is \((H-k+1)\times(W-k+1)\).
--- starter
def conv2d(image, kernel):
    raise NotImplementedError
--- solution
def conv2d(image, kernel):
    H, W = len(image), len(image[0])
    kh, kw = len(kernel), len(kernel[0])
    out = []
    for i in range(H - kh + 1):
        row = []
        for j in range(W - kw + 1):
            row.append(sum(image[i + m][j + n] * kernel[m][n] for m in range(kh) for n in range(kw)))
        out.append(row)
    return out
--- tests
img = [[3, 3, 3, 0, 0]] * 5
k = [[1, 0, -1]] * 3
out = conv2d(img, k)
assert len(out) == 3 and len(out[0]) == 3, "a 5x5 image and 3x3 kernel give a 3x3 output"
assert out[0] == [0, 9, 9], f"vertical-edge kernel should respond at the edge, got {out[0]}"
assert conv2d([[1, 2], [3, 4]], [[1]]) == [[1, 2], [3, 4]], "a 1x1 identity kernel returns the image"

@exercise dl-attention
lesson: transformer
title: Causal scaled dot-product attention
packages: numpy
--- prompt
Write `attention(Q, K, V, causal=True)` for 2-D arrays of shape `(T, d)`. Compute scores `Q @ K.T / sqrt(d)`, set scores where key position > query position to `-inf` when `causal`, apply a numerically stable row-wise softmax, and return `(output, weights)`.
--- starter
import numpy as np

def attention(Q, K, V, causal=True):
    raise NotImplementedError
--- solution
import numpy as np

def attention(Q, K, V, causal=True):
    T, d = Q.shape
    scores = Q @ K.T / np.sqrt(d)
    if causal:
        scores = np.where(np.triu(np.ones((T, T), dtype=bool), k=1), -np.inf, scores)
    scores = scores - scores.max(axis=1, keepdims=True)
    w = np.exp(scores)
    w = w / w.sum(axis=1, keepdims=True)
    return w @ V, w
--- tests
import numpy as np
rng = np.random.default_rng(0)
Q, K, V = rng.normal(size=(5, 8)), rng.normal(size=(5, 8)), rng.normal(size=(5, 8))
out, w = attention(Q, K, V)
assert out.shape == (5, 8) and w.shape == (5, 5), "output (T, d) and weights (T, T)"
assert np.allclose(w.sum(axis=1), 1), "each row of weights must sum to 1"
assert np.allclose(np.triu(w, k=1), 0), "with the causal mask no token may attend to the future"
assert np.allclose(out[0], V[0]), "the first token can only attend to itself"
_, w2 = attention(Q, K, V, causal=False)
assert (w2 > 0).all(), "without the mask every weight is positive"
