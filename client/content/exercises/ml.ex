@exercise ml-ridge
lesson: linear-regression
title: Ridge regression in closed form
packages: numpy
--- prompt
Write `ridge(X, y, lam)` returning the weights \(\hat{\mathbf w}=(\mathbf X^\top\mathbf X+\lambda\mathbf I)^{-1}\mathbf X^\top\mathbf y\). Use `np.linalg.solve` rather than computing an inverse. With `lam=0` it is ordinary least squares.
--- starter
import numpy as np

def ridge(X, y, lam=0.0):
    raise NotImplementedError
--- solution
import numpy as np

def ridge(X, y, lam=0.0):
    d = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(d), X.T @ y)
--- tests
import numpy as np
rng = np.random.default_rng(0)
X = np.c_[np.ones(100), rng.normal(size=(100, 2))]
w_true = np.array([1.0, 2.0, -3.0])
y = X @ w_true
assert np.allclose(ridge(X, y, 0.0), w_true), "without noise and lam=0 you should recover the true weights"
w_big = ridge(X, y, 1000.0)
assert np.linalg.norm(w_big) < np.linalg.norm(w_true), "a large lambda should shrink the weights"
yn = y + rng.normal(size=100)
w = ridge(X, yn, 0.0)
assert np.allclose(X.T @ (yn - X @ w), 0, atol=1e-8), "residuals must be orthogonal to every feature (the normal equations)"

@exercise ml-prf
lesson: metrics
title: Precision, recall and F1
--- prompt
Write `prf(y_true, y_pred)` for binary labels (0/1) that returns a tuple `(precision, recall, f1)`. Return 0.0 for any metric whose denominator is zero.
--- starter
def prf(y_true, y_pred):
    tp = fp = fn = 0
    # count, then compute the three metrics safely
    raise NotImplementedError
--- solution
def prf(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1
--- tests
import math
p, r, f = prf([1, 1, 1, 0, 0, 0], [1, 1, 0, 1, 0, 0])
assert math.isclose(p, 2 / 3) and math.isclose(r, 2 / 3), f"expected precision and recall 2/3, got {p}, {r}"
assert math.isclose(f, 2 / 3), "F1 of equal precision and recall equals them"
assert prf([0, 0], [0, 0]) == (0.0, 0.0, 0.0), "no positives predicted or present should give zeros, not an error"

@exercise ml-auc
lesson: metrics
title: ROC-AUC by counting pairs
--- prompt
Write `auc(scores, labels)`: the probability that a randomly chosen positive gets a higher score than a randomly chosen negative. Count ties as half. A simple O(P·N) double loop is fine.
--- starter
def auc(scores, labels):
    pos = [s for s, y in zip(scores, labels) if y == 1]
    neg = [s for s, y in zip(scores, labels) if y == 0]
    raise NotImplementedError
--- solution
def auc(scores, labels):
    pos = [s for s, y in zip(scores, labels) if y == 1]
    neg = [s for s, y in zip(scores, labels) if y == 0]
    wins = 0.0
    for p in pos:
        for n in neg:
            wins += 1.0 if p > n else 0.5 if p == n else 0.0
    return wins / (len(pos) * len(neg))
--- tests
import math
assert auc([0.9, 0.8, 0.3, 0.1], [1, 1, 0, 0]) == 1.0, "perfect ranking gives AUC 1"
assert auc([0.1, 0.2, 0.8, 0.9], [1, 1, 0, 0]) == 0.0, "reversed ranking gives AUC 0"
assert math.isclose(auc([0.5, 0.5], [1, 0]), 0.5), "a tie counts as half"
assert math.isclose(auc([0.9, 0.4, 0.6, 0.2], [1, 1, 0, 0]), 0.75), "3 of 4 positive-negative pairs are ordered correctly"

@exercise ml-gini-split
lesson: trees-ensembles
title: Best decision-tree split
--- prompt
Write `gini(labels)` and `best_split(x, y)`. `best_split` takes one numeric feature `x` and binary labels `y`, tries thresholds halfway between consecutive distinct sorted values, and returns `(threshold, weighted_gini)` for the split `x <= threshold` that minimizes the size-weighted Gini impurity of the two children.
--- starter
def gini(labels):
    raise NotImplementedError

def best_split(x, y):
    raise NotImplementedError
--- solution
def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    p = sum(labels) / n
    return 1 - p * p - (1 - p) * (1 - p)

def best_split(x, y):
    values = sorted(set(x))
    best = (None, float("inf"))
    for a, b in zip(values, values[1:]):
        t = (a + b) / 2
        left = [yi for xi, yi in zip(x, y) if xi <= t]
        right = [yi for xi, yi in zip(x, y) if xi > t]
        w = (len(left) * gini(left) + len(right) * gini(right)) / len(y)
        if w < best[1]:
            best = (t, w)
    return best
--- tests
import math
assert math.isclose(gini([1, 1, 1, 1, 1, 1, 0, 0, 0, 0]), 0.48), "6 positives and 4 negatives have Gini 0.48"
assert gini([1, 1]) == 0.0, "a pure node has Gini 0"
t, w = best_split([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1])
assert math.isclose(t, 6.5) and w == 0.0, f"the perfect split is at 6.5 with impurity 0, got {t}, {w}"

@exercise ml-kmeans-step
lesson: unsupervised
title: One step of k-means
--- prompt
Write `kmeans_step(points, centroids)` for 2-D points given as `(x, y)` tuples. Assign each point to its nearest centroid (squared Euclidean distance), then move each centroid to the mean of its points. A centroid with no points stays where it is. Return `(assignments, new_centroids)`.
--- starter
def kmeans_step(points, centroids):
    raise NotImplementedError
--- solution
def kmeans_step(points, centroids):
    assign = []
    for (px, py) in points:
        d = [(px - cx) ** 2 + (py - cy) ** 2 for cx, cy in centroids]
        assign.append(d.index(min(d)))
    new = []
    for k, c in enumerate(centroids):
        members = [p for p, a in zip(points, assign) if a == k]
        if members:
            new.append((sum(p[0] for p in members) / len(members), sum(p[1] for p in members) / len(members)))
        else:
            new.append(c)
    return assign, new
--- tests
pts = [(0, 0), (0, 1), (10, 10), (10, 11)]
a, c = kmeans_step(pts, [(0, 0), (10, 10)])
assert a == [0, 0, 1, 1], f"assignments should be [0, 0, 1, 1], got {a}"
assert c == [(0.0, 0.5), (10.0, 10.5)], f"centroids should move to the cluster means, got {c}"
a2, c2 = kmeans_step(pts, [(0, 0), (10, 10), (100, 100)])
assert c2[2] == (100, 100), "an empty cluster keeps its centroid"
