@exercise ops-psi
lesson: mlops
title: Population stability index
--- prompt
Write `psi(expected, actual, bins)` for two lists of numbers. Use the given bin edges (a sorted list; values outside go to the first or last bin), compute the proportion of each list in every bin, replace zero proportions with `1e-6`, and return

$$\text{PSI}=\sum_i (a_i-e_i)\ln\frac{a_i}{e_i}$$
--- starter
import math

def psi(expected, actual, bins):
    raise NotImplementedError
--- solution
import math

def psi(expected, actual, bins):
    def props(values):
        counts = [0] * (len(bins) - 1)
        for v in values:
            i = 0
            while i < len(bins) - 2 and v >= bins[i + 1]:
                i += 1
            counts[i] += 1
        n = len(values)
        return [max(c / n, 1e-6) for c in counts]
    e, a = props(expected), props(actual)
    return sum((ai - ei) * math.log(ai / ei) for ai, ei in zip(a, e))
--- tests
import math, random
random.seed(0)
bins = [0, 25, 50, 75, 100]
base = [random.uniform(0, 100) for _ in range(5000)]
same = [random.uniform(0, 100) for _ in range(5000)]
shifted = [random.uniform(40, 100) for _ in range(5000)]
assert psi(base, same, bins) < 0.02, "two samples of the same distribution should have PSI near 0"
assert psi(base, shifted, bins) > 0.2, "a large shift should give PSI above 0.2"
assert psi([10, 60], [10, 60], bins) == 0.0, "identical data gives 0"
