@exercise llm-sampling
lesson: decoding
title: Temperature and top-p filtering
--- prompt
Write `next_token_probs(logits, temperature=1.0, top_p=1.0)` that returns a list of probabilities (same length as `logits`):

- divide logits by the temperature and apply a stable softmax;
- keep the smallest set of most likely tokens whose cumulative probability reaches `top_p` (always keep at least one);
- set the others to 0 and renormalize.
--- starter
import math

def next_token_probs(logits, temperature=1.0, top_p=1.0):
    raise NotImplementedError
--- solution
import math

def next_token_probs(logits, temperature=1.0, top_p=1.0):
    z = [l / temperature for l in logits]
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    p = [v / s for v in e]
    order = sorted(range(len(p)), key=lambda i: p[i], reverse=True)
    keep, cum = set(), 0.0
    for i in order:
        keep.add(i)
        cum += p[i]
        if cum >= top_p:
            break
    total = sum(p[i] for i in keep)
    return [p[i] / total if i in keep else 0.0 for i in range(len(p))]
--- tests
import math
p = next_token_probs([2.0, 1.0, 0.0])
assert math.isclose(sum(p), 1.0) and p[0] > p[1] > p[2], "plain softmax ordering"
cold = next_token_probs([2.0, 1.0, 0.0], temperature=0.1)
assert cold[0] > 0.99, "low temperature should be nearly greedy"
hot = next_token_probs([2.0, 1.0, 0.0], temperature=10.0)
assert max(hot) - min(hot) < 0.1, "high temperature should be nearly uniform"
nuc = next_token_probs([3.0, 2.9, -5.0, -6.0], top_p=0.9)
assert nuc[2] == 0.0 and nuc[3] == 0.0 and math.isclose(sum(nuc), 1.0), "top-p should drop the unlikely tail and renormalize"

@exercise llm-pass-at-k
lesson: llm-eval-safety
title: Unbiased pass@k
--- prompt
Given `n` generated samples of which `c` pass the tests, write `pass_at_k(n, c, k)` using the unbiased estimator

$$\text{pass@}k=1-\binom{n-c}{k}\Big/\binom{n}{k}$$

Return 1.0 when \(n-c\lt k\) (every draw of k samples must contain a correct one).
--- starter
from math import comb

def pass_at_k(n, c, k):
    raise NotImplementedError
--- solution
from math import comb

def pass_at_k(n, c, k):
    if n - c < k:
        return 1.0
    return 1 - comb(n - c, k) / comb(n, k)
--- tests
import math
assert math.isclose(pass_at_k(20, 3, 1), 0.15), "pass@1 with 3/20 correct is 0.15"
assert pass_at_k(10, 0, 5) == 0.0, "no correct samples gives 0"
assert pass_at_k(5, 3, 3) == 1.0, "if fewer than k samples are wrong, pass@k is 1"
assert pass_at_k(20, 3, 5) > pass_at_k(20, 3, 1), "more attempts can only help"
