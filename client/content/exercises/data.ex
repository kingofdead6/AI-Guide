@exercise data-standardize
lesson: numpy
title: Vectorized standardization
packages: numpy
--- prompt
Write `standardize(X)` that takes a NumPy array of shape `(n, d)` and returns a new array where every column has mean 0 and standard deviation 1. Columns with zero standard deviation should become all zeros (not NaN). No Python loops over rows.
--- starter
import numpy as np

def standardize(X):
    raise NotImplementedError
--- solution
import numpy as np

def standardize(X):
    X = np.asarray(X, dtype=float)
    mu = X.mean(axis=0)
    sd = X.std(axis=0)
    sd = np.where(sd == 0, 1.0, sd)
    return (X - mu) / sd
--- tests
import numpy as np
X = np.array([[1.0, 10.0, 5.0], [2.0, 20.0, 5.0], [3.0, 30.0, 5.0]])
Z = standardize(X)
assert Z.shape == (3, 3), f"shape should stay (3, 3), got {Z.shape}"
assert np.allclose(Z[:, :2].mean(axis=0), 0), "columns should have mean 0"
assert np.allclose(Z[:, :2].std(axis=0), 1), "columns should have std 1"
assert np.allclose(Z[:, 2], 0) and not np.isnan(Z).any(), "a constant column should become zeros, not NaN"
assert X[0, 0] == 1.0, "do not modify the input array"

@exercise data-edit-distance
lesson: dsa
title: Edit distance with dynamic programming
--- prompt
Write `edit_distance(a, b)`: the minimum number of insertions, deletions and substitutions that turn sequence `a` into sequence `b`. It should work on strings and on lists of words (that is how word error rate is computed).
--- starter
def edit_distance(a, b):
    # dp[i][j] = distance between a[:i] and b[:j]
    raise NotImplementedError
--- solution
def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1]))
        prev = cur
    return prev[-1]
--- tests
assert edit_distance("kitten", "sitting") == 3, "kitten -> sitting needs 3 edits"
assert edit_distance("", "abc") == 3, "building from empty needs 3 insertions"
assert edit_distance("same", "same") == 0, "identical strings have distance 0"
ref = "the cat sat on the mat".split()
hyp = "the cat sit on mat".split()
assert edit_distance(ref, hyp) == 2, "word level: one substitution and one deletion"
