@exercise rl-returns
lesson: policy-gradient
title: Discounted returns
--- prompt
Write `returns(rewards, gamma)` that computes \(G_t=\sum_{k\ge0}\gamma^k r_{t+k}\) for every time step of an episode. Do it in one backward pass: \(G_t=r_t+\gamma G_{t+1}\).
--- starter
def returns(rewards, gamma):
    raise NotImplementedError
--- solution
def returns(rewards, gamma):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]
--- tests
import math
g = returns([1, 1, 1], 0.9)
assert all(math.isclose(a, b) for a, b in zip(g, [2.71, 1.9, 1.0])), f"expected [2.71, 1.9, 1.0], got {g}"
assert returns([0, 0, 10], 0.5) == [2.5, 5.0, 10.0], "rewards are discounted back in time"
assert returns([], 0.9) == [], "an empty episode has no returns"

@exercise rl-value-iteration
lesson: rl-foundations
title: Value iteration on a corridor
--- prompt
A corridor has states 0..4. State 4 is terminal with reward +1 on arrival; every other move gives reward 0. Actions: -1 (left) and +1 (right); moving left from 0 stays at 0. Write `value_iteration(gamma=0.9, iters=100)` returning the list of optimal values \(V^*(s)\) for states 0..4, with \(V^*(4)=0\).
--- starter
def value_iteration(gamma=0.9, iters=100):
    V = [0.0] * 5
    raise NotImplementedError
--- solution
def value_iteration(gamma=0.9, iters=100):
    V = [0.0] * 5
    for _ in range(iters):
        new = V[:]
        for s in range(4):
            best = float("-inf")
            for a in (-1, 1):
                s2 = min(max(s + a, 0), 4)
                r = 1.0 if s2 == 4 else 0.0
                best = max(best, r + gamma * (0.0 if s2 == 4 else V[s2]))
            new[s] = best
        V = new
    return V
--- tests
import math
V = value_iteration()
expected = [0.729, 0.81, 0.9, 1.0, 0.0]
assert all(math.isclose(a, b, abs_tol=1e-6) for a, b in zip(V, expected)), f"expected {expected}, got {V}"
