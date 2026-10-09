@exercise py-top-words
lesson: py-collections
title: Most frequent words
--- prompt
Write `top_words(text, k)` that returns the `k` most frequent words as a list of `(word, count)` pairs.

- Lowercase the text and treat these characters as spaces: `.,!?;:"()`
- Sort by count (highest first), then alphabetically to break ties.
--- starter
def top_words(text, k):
    # 1. normalize: lowercase, replace punctuation with spaces
    # 2. count words (collections.Counter is allowed)
    # 3. sort by (-count, word) and return the first k pairs
    raise NotImplementedError
--- solution
from collections import Counter

def top_words(text, k):
    for ch in '.,!?;:"()':
        text = text.replace(ch, " ")
    counts = Counter(text.lower().split())
    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:k]
--- tests
assert top_words("the cat and the hat", 1) == [("the", 2)], "the most frequent word should be ('the', 2)"
assert top_words("B a b. A, c!", 2) == [("a", 2), ("b", 2)], "ties must be broken alphabetically after lowercasing"
assert top_words("", 3) == [], "empty text should give an empty list"
assert len(top_words("x y z w", 10)) == 4, "asking for more words than exist returns all of them"
print("example:", top_words("To be, or not to be: that is the question.", 3))

@exercise py-batched
lesson: py-iterators
title: A batching generator
--- prompt
Write a generator `batched(iterable, n)` that yields lists of up to `n` items. The last batch may be shorter. It must work on any iterable, including infinite ones, so don't convert the input to a list.
--- starter
def batched(iterable, n):
    batch = []
    # TODO: loop over iterable, yield full batches, then yield the remainder
    raise NotImplementedError
--- solution
def batched(iterable, n):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == n:
            yield batch
            batch = []
    if batch:
        yield batch
--- tests
import itertools, types
assert isinstance(batched([1, 2, 3], 2), types.GeneratorType), "batched should be a generator function (use yield)"
assert list(batched(range(7), 3)) == [[0, 1, 2], [3, 4, 5], [6]], "7 items in batches of 3"
assert list(batched([], 4)) == [], "an empty input yields nothing"
first = next(batched(itertools.count(), 5))
assert first == [0, 1, 2, 3, 4], "must work on an infinite iterator without materializing it"

@exercise py-running-stats
lesson: py-oop
title: Running mean and variance
--- prompt
Implement a class `RunningStats` with a method `update(x)` and properties `mean` and `variance` (population variance). Use Welford's algorithm so you never store the values:

$$n\leftarrow n+1,\quad \delta=x-\mu,\quad \mu\leftarrow\mu+\delta/n,\quad M_2\leftarrow M_2+\delta\,(x-\mu)$$

and `variance = M2 / n` (0.0 when there is no data).
--- starter
class RunningStats:
    def __init__(self):
        self.n = 0
        self.mu = 0.0
        self.m2 = 0.0

    def update(self, x):
        raise NotImplementedError

    @property
    def mean(self):
        return self.mu

    @property
    def variance(self):
        raise NotImplementedError
--- solution
class RunningStats:
    def __init__(self):
        self.n = 0
        self.mu = 0.0
        self.m2 = 0.0

    def update(self, x):
        self.n += 1
        delta = x - self.mu
        self.mu += delta / self.n
        self.m2 += delta * (x - self.mu)

    @property
    def mean(self):
        return self.mu

    @property
    def variance(self):
        return self.m2 / self.n if self.n else 0.0
--- tests
import math, random
s = RunningStats()
assert s.variance == 0.0, "variance with no data should be 0.0"
data = [2, 4, 4, 4, 5, 5, 7, 9]
for v in data:
    s.update(v)
assert math.isclose(s.mean, 5.0), f"mean should be 5.0, got {s.mean}"
assert math.isclose(s.variance, 4.0), f"population variance should be 4.0, got {s.variance}"
big = RunningStats()
for v in [1e9 + 1, 1e9 + 2, 1e9 + 3]:
    big.update(v)
assert math.isclose(big.variance, 2 / 3, rel_tol=1e-6), "should stay accurate for large values (no catastrophic cancellation)"
