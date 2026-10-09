"""LLM, RAG, generative, RL and systems figures."""
import math
import numpy as np
from fig_lib import F, P

rng = np.random.default_rng(5)


def vflow(name, label, items, w=440, bw=320, bh=46, gap=26, notes=None):
    h = 16 + len(items) * (bh + gap)
    f = F(name, w, h, label)
    x = (w - bw) / 2
    for i, it in enumerate(items):
        t, t2, cls = it
        y = 10 + i * (bh + gap)
        f.rect(x, y, bw, bh, cls, 10, t, 'sm' if len(t) > 30 else '', t2)
        if i < len(items) - 1:
            f.line(w / 2, y + bh, w / 2, y + bh + gap - 2, 'ln', 'm')
    return f


def llm_pipeline():
    f = vflow('llm_pipeline', 'How a chat LLM is made', [
        ('Web-scale text and code', 'trillions of tokens, filtered and deduplicated', 'b2'),
        ('Pretraining: next-token prediction', 'weeks on thousands of GPUs', 'bacc'),
        ('Base model', 'knows a lot, follows instructions poorly', 'box'),
        ('Supervised fine-tuning (SFT)', 'curated instruction → response examples', 'bacc'),
        ('Preference tuning and RL', 'RLHF, DPO, RL with verifiable rewards', 'bacc'),
        ('Assistant model', 'helpful, honest, safer, better at reasoning', 'b3')])
    f.done()


def scaling_law():
    f = P('scaling_law', 480, 300, 'Loss vs training compute for several model sizes', (18, 24), (1.8, 4.6))
    f.axes([18, 19, 20, 21, 22, 23, 24], [2, 2.5, 3, 3.5, 4, 4.5], 'training compute (FLOPs)', 'loss',
           xf=lambda v: f'1e{int(v)}')
    E, A, B, al, be = 1.69, 406.4, 410.7, 0.34, 0.28
    lc = np.linspace(18, 24, 200); C = 10 ** lc
    cls = ['s1', 's2', 's3', 's4', 's5']
    for k, N in enumerate([1e8, 4e8, 1.6e9, 6.4e9, 2.6e10]):
        D = C / (6 * N); m = D > N * 0.5
        L = E + A / N ** al + B / D ** be
        f.curve(lc[m], L[m], cls[k] + ' thin2')
    Ns = np.logspace(7, 12, 400)
    env = [min(E + A / Ns ** al + B / (c / (6 * Ns)) ** be) for c in C]
    f.curve(lc, env, 'sm1', dash=True)
    f.legend([('s1', '100M params'), ('s3', '1.6B'), ('s5', '26B'), ('sm1 dash', 'compute-optimal frontier')], 250, 30)
    f.done()


def lora():
    f = F('lora', 440, 320, 'LoRA adds a trainable low-rank path beside a frozen weight matrix')
    f.rect(50, 90, 150, 150, 'pnl', 6, 'W₀', 'lg b', 'd × k, frozen')
    f.rect(290, 102, 100, 42, 'b2', 6, 'B: d × r', 'sm', 'init = 0', t2cls='xs mut')
    f.rect(280, 196, 120, 42, 'b2', 6, 'A: r × k', 'sm', 'trainable', t2cls='xs tc2')
    f.text(220, 300, 'x', 'b')
    f.path('M220,288 L220,270 L125,270 L125,242', 'ln', 'm'); f.path('M220,270 L340,270 L340,240', 'ln', 'm')
    f.line(340, 196, 340, 146, 'ln', 'm')
    f.circ(220, 48, 15, 'node', '+')
    f.path('M125,90 L125,48 L203,48', 'ln', 'm'); f.path('M340,102 L340,48 L237,48', 'ln', 'm')
    f.text(330, 172, '× α/r', 'xs mut', anchor='end')
    f.text(220, 14, 'h = W₀x + (α/r)·BAx', 'sm b')
    f.done()


def rlhf():
    f = F('rlhf', 480, 400, 'The three stages of RLHF')
    f.rect(20, 10, 440, 60, 'bacc', 12, '1 · Supervised fine-tuning', 'b', 'train on human-written demonstrations → π_SFT')
    f.rect(20, 100, 440, 110, 'pnl', 12); f.text(240, 120, '2 · Reward model', 'b')
    f.rect(36, 140, 90, 40, 'box', 8, 'prompt x', 'sm'); f.rect(146, 140, 120, 40, 'box', 8, 'y_w ≻ y_l', 'sm')
    f.rect(286, 140, 158, 40, 'b2', 8, 'train r_φ(x, y)', 'sm')
    f.line(126, 160, 144, 160, 'ln', 'm'); f.line(266, 160, 284, 160, 'ln', 'm')
    f.text(206, 196, 'humans compare two responses', 'xs mut')
    f.rect(20, 240, 440, 150, 'pnl', 12); f.text(240, 260, '3 · RL fine-tuning (PPO)', 'b')
    f.rect(40, 286, 120, 46, 'bacc', 8, 'policy π_θ', 'sm', 'generates y')
    f.rect(320, 286, 120, 46, 'b2', 8, 'r_φ(x, y)', 'sm', 'scores y')
    f.rect(170, 342, 140, 40, 'b5', 8, 'reward − β·KL', 'sm')
    f.line(160, 300, 318, 300, 'ln', 'm'); f.path('M380,332 L380,362 L312,362', 'ln', 'm'); f.path('M168,362 L100,362 L100,334', 'lna', 'a')
    f.text(240, 290, 'response', 'xs mut'); f.text(118, 378, 'PPO update', 'xs acc')
    f.line(240, 70, 240, 98, 'ln', 'm'); f.line(240, 210, 240, 238, 'ln', 'm')
    f.done()


def kvcache():
    f = F('kvcache', 520, 240, 'The KV cache stores keys and values of past tokens')
    toks = ['The', 'cat', 'sat', 'on', 'the', 'mat']
    for i, t in enumerate(toks):
        x = 110 + i * 64; new = (i == 5)
        f.text(x + 28, 30, t, 'sm b' if new else 'sm')
        f.rect(x, 100, 56, 38, 'b2' if new else 'cached', 6, 'k₆' if new else f'k{"₁₂₃₄₅"[i]}', 'sm')
        f.rect(x, 50, 56, 38, 'b2' if new else 'cached', 6, 'v₆' if new else f'v{"₁₂₃₄₅"[i]}', 'sm')
    f.text(96, 119, 'K cache', 'sm', anchor='end'); f.text(96, 69, 'V cache', 'sm', anchor='end')
    f.rect(430, 170, 56, 38, 'bacc', 6, 'q₆', 'sm b')
    for i in range(6):
        f.line(458, 170, 110 + i * 64 + 28, 140, 'lna thin')
    f.text(250, 190, 'new token: compute only q₆, k₆, v₆;', 'xs', anchor='middle')
    f.text(250, 208, 'reuse cached k₁…k₅, v₁…v₅ from memory', 'xs mut')
    f.done()


def moe():
    f = F('moe', 480, 300, 'Mixture of experts: a router sends each token to a few experts')
    f.rect(16, 126, 80, 44, 'b2', 8, 'token x', 'sm')
    f.rect(126, 120, 100, 56, 'bacc', 8, 'Router', 'b', 'softmax, top-2')
    f.line(96, 148, 124, 148, 'ln', 'm')
    ys = [20, 86, 152, 218]; act = {0: '0.7', 2: '0.3'}
    for i, y in enumerate(ys):
        on = i in act
        f.rect(276, y, 100, 50, 'b3' if on else 'dropped', 8, f'Expert {i + 1}', 'sm' if on else 'sm mut', 'FFN')
        f.line(226, 148, 274, y + 25, 'lna' if on else 'ln dash', 'a' if on else None)
        if on:
            f.text(250, 70 if i == 0 else 200, f'g = {act[i]}', 'xs acc', anchor='end')
            f.line(376, y + 25, 412, 148, 'lna', 'a')
    f.circ(426, 148, 15, 'node', 'Σ')
    f.text(426, 186, 'y = Σ gᵢ·Eᵢ(x)', 'xs')
    f.done()


def memory_breakdown():
    f = F('memory_breakdown', 480, 220, 'Bytes per parameter: training vs inference')
    parts = [('bf16 weights', 2, 'bacc'), ('bf16 grads', 2, 'b2'), ('fp32 master', 4, 'b4'), ('Adam m', 4, 'b3'), ('Adam v', 4, 'b5')]
    s = 22; x0 = 120
    f.text(110, 50, 'Training (Adam)', 'sm', anchor='end')
    x = x0
    for lab, b, cls in parts:
        f.rect(x, 34, b * s, 32, cls, 2, f'{b}', 'xs b')
        x += b * s
    f.text(x + 8, 50, '= 16 B', 'sm b', anchor='start')
    y = 92
    for i, (lab, b, cls) in enumerate(parts):
        f.rect(x0 + (i % 3) * 120, y + (i // 3) * 20, 12, 12, cls, 2); f.text(x0 + (i % 3) * 120 + 18, y + 6 + (i // 3) * 20, lab, 'xs', anchor='start')
    f.text(110, 160, 'Inference fp16', 'sm', anchor='end'); f.rect(x0, 146, 2 * s, 28, 'bacc', 2, '2', 'xs b')
    f.text(110, 196, 'Inference int4', 'sm', anchor='end'); f.rect(x0, 184, 0.5 * s, 24, 'bacc', 2)
    f.text(x0 + 2 * s + 8, 160, '7B model → ~14 GB', 'xs mut', anchor='start'); f.text(x0 + 0.5 * s + 8, 196, '~3.5 GB', 'xs mut', anchor='start')
    f.done()


def rag_pipeline():
    f = F('rag_pipeline', 480, 470, 'Retrieval-augmented generation: indexing and querying')
    f.text(110, 16, 'Indexing (offline)', 'sm b'); f.text(360, 16, 'Query (online)', 'sm b')
    L = [('Documents', 'b2'), ('Parse + chunk', 'box'), ('Embed chunks', 'bacc'), ('Vector index + BM25', 'b4')]
    R = [('User question', 'b2'), ('Rewrite + embed', 'bacc'), ('Hybrid retrieve top-k', 'box'), ('Rerank → best 5', 'box'),
         ('Prompt + sources', 'box'), ('LLM → cited answer', 'b3')]
    for i, (t, c) in enumerate(L):
        f.rect(15, 34 + i * 72, 190, 44, c, 10, t, 'sm')
        if i < len(L) - 1:
            f.line(110, 78 + i * 72, 110, 104 + i * 72, 'ln', 'm')
    for i, (t, c) in enumerate(R):
        f.rect(270, 34 + i * 72, 195, 44, c, 10, t, 'sm')
        if i < len(R) - 1:
            f.line(367, 78 + i * 72, 367, 104 + i * 72, 'ln', 'm')
    f.path('M205,272 L237,272 L237,200 L268,200', 'lc2', 'c2')
    f.text(232, 300, 'search', 'xs tc2')
    f.done()


def hnsw():
    f = F('hnsw', 480, 360, 'HNSW: greedy search through a hierarchy of proximity graphs')
    layers = [(50, 5, 'layer 2 (sparse)'), (160, 11, 'layer 1'), (270, 24, 'layer 0 (all vectors)')]
    path_pts = []
    for li, (y, n, lab) in enumerate(layers):
        f.poly([(60, y + 60), (130, y), (470, y), (400, y + 60)], 'plane')
        f.text(14, y + 30, lab, 'xs mut', anchor='start')
        r = np.random.default_rng(li + 3)
        P_ = [(130 + r.uniform(0.05, 0.95) * 290 - (yy := r.uniform(0.1, 0.9)) * 70, y + yy * 60) for _ in range(n)]
        P_.sort()
        for a, b in zip(P_[:-1], P_[1:]):
            f.line(*a, *b, 'ln thin')
        for p in P_:
            f.circ(*p, 4, 'fm')
        path_pts.append(P_)
    route = [path_pts[0][0], path_pts[0][3], path_pts[1][6], path_pts[1][8], path_pts[2][17], path_pts[2][19]]
    for a, b in zip(route[:-1], route[1:]):
        f.line(*a, *b, 'lc5 thick', 'c5')
    f.circ(*route[-1], 7, 'f3'); f.text(route[-1][0] + 10, route[-1][1] + 18, 'nearest neighbour', 'xs tc3', anchor='start')
    f.text(route[0][0], route[0][1] - 14, 'entry point', 'xs tc5')
    f.done()


def funnel(name, label, stages, w=440):
    h = 20 + len(stages) * 58
    f = F(name, w, h, label)
    cls = ['b2', 'bacc', 'b4', 'b3', 'b5']
    for i, (t, sub) in enumerate(stages):
        top = 10 + i * 58; wt = w - 40 - i * 70; wb = w - 40 - (i + 1) * 70
        cx = w / 2
        f.poly([(cx - wt / 2, top), (cx + wt / 2, top), (cx + wb / 2, top + 50), (cx - wb / 2, top + 50)], cls[i % 5])
        f.text(cx, top + 18, t, 'sm b'); f.text(cx, top + 36, sub, 'xs mut')
    f.done()


def agent_loop():
    f = F('agent_loop', 500, 300, 'An agent loop: the model decides, tools act, results feed back')
    f.rect(170, 110, 140, 70, 'bacc', 12, 'LLM', 'lg b', 'reason → decide')
    f.rect(360, 110, 130, 70, 'b2', 12, 'Tools', 'b', 'search, code, APIs', t2cls='xs mut')
    f.rect(10, 110, 110, 70, 'b4', 12, 'User / goal', 'sm')
    f.rect(170, 230, 140, 50, 'b3', 10, 'Memory', 'sm', 'history, notes')
    f.path('M310,130 L358,130', 'lna', 'a'); f.text(334, 118, 'tool call', 'xs acc')
    f.path('M358,160 L312,160', 'lc2', 'c2'); f.text(334, 174, 'result', 'xs tc2')
    f.line(120, 130, 168, 130, 'ln', 'm'); f.line(168, 160, 122, 160, 'ln', 'm')
    f.text(144, 118, 'task', 'xs mut'); f.text(144, 174, 'answer', 'xs mut')
    f.line(240, 180, 240, 228, 'ln', 'm'); f.line(260, 228, 260, 182, 'ln', 'm')
    f.path('M240,108 C240,40 300,40 300,108', 'lc5 dash', 'c5'); f.text(270, 32, 'repeat until done or step limit', 'xs tc5')
    f.done()


def vae():
    f = F('vae', 560, 230, 'Variational autoencoder')
    f.rect(10, 80, 54, 60, 'b2', 8, 'x', 'b')
    f.poly([(80, 60), (170, 85), (170, 135), (80, 160)], 'bacc'); f.text(122, 110, 'encoder', 'xs'); f.text(122, 174, 'q_φ(z|x)', 'xs mut')
    f.line(64, 110, 78, 110, 'ln', 'm')
    f.rect(190, 60, 54, 36, 'bacc', 6, 'μ', 'b'); f.rect(190, 124, 54, 36, 'bacc', 6, 'σ', 'b')
    f.line(170, 100, 188, 80, 'ln', 'm'); f.line(170, 120, 188, 140, 'ln', 'm')
    f.rect(270, 88, 100, 44, 'b4', 8, 'z = μ + σ⊙ε', 'sm')
    f.line(244, 78, 268, 100, 'ln', 'm'); f.line(244, 142, 268, 120, 'ln', 'm')
    f.text(320, 196, 'ε ~ N(0, I)', 'xs tc4'); f.line(320, 184, 320, 134, 'lc4 dash', 'c4')
    f.poly([(390, 85), (480, 60), (480, 160), (390, 135)], 'b3'); f.text(437, 110, 'decoder', 'xs'); f.text(437, 174, 'p_θ(x|z)', 'xs mut')
    f.line(370, 110, 388, 110, 'ln', 'm')
    f.rect(496, 80, 54, 60, 'b2', 8, 'x̂', 'b'); f.line(480, 110, 494, 110, 'ln', 'm')
    f.text(280, 18, 'loss = reconstruction(x, x̂) + KL(q_φ(z|x) ‖ N(0, I))', 'sm')
    f.done()


def gan():
    f = F('gan', 520, 250, 'A generative adversarial network')
    f.rect(10, 150, 80, 44, 'b4', 8, 'noise z', 'sm')
    f.rect(120, 140, 110, 64, 'bacc', 10, 'Generator G', 'sm b')
    f.rect(260, 150, 80, 44, 'b2', 8, 'fake G(z)', 'sm')
    f.rect(260, 40, 80, 44, 'b3', 8, 'real x', 'sm')
    f.rect(370, 85, 130, 64, 'b5', 10, 'Discriminator D', 'sm b', 'real or fake?')
    f.line(90, 172, 118, 172, 'ln', 'm'); f.line(230, 172, 258, 172, 'ln', 'm')
    f.line(340, 62, 368, 100, 'ln', 'm'); f.line(340, 172, 368, 135, 'ln', 'm')
    f.path('M435,149 L435,226 L175,226 L175,206', 'lc5 dash', 'c5')
    f.text(305, 240, 'gradient: make fakes look real', 'xs tc5')
    f.done()


def diffusion():
    f = F('diffusion', 560, 240, 'Diffusion: add noise step by step, learn to reverse it')
    n = 6; cell = 10
    base = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            base[i, j] = 1.0 if (i - 2.5) ** 2 + (j - 2.5) ** 2 < 5.5 else 0.0
    noise = np.random.default_rng(2).normal(size=(n, n))
    abars = [1.0, 0.75, 0.45, 0.18, 0.0]
    labels = ['x₀', 'x₁', 'x_t', 'x_{T−1}', 'x_T']
    xs = [24 + k * 110 for k in range(5)]
    for k, ab in enumerate(abars):
        v = math.sqrt(ab) * (base * 2 - 1) + math.sqrt(1 - ab) * noise
        for i in range(n):
            for j in range(n):
                val = max(-1, min(1, v[i, j]))
                f.add(f'<rect x="{xs[k] + j * cell}" y="{80 + i * cell}" width="{cell}" height="{cell}" class="{"heat" if val >= 0 else "heat2"}" opacity="{abs(val):.2f}"/>')
        f.rect(xs[k], 80, n * cell, n * cell, 'frame', 0)
        f.text(xs[k] + 30, 158, labels[k], 'sm')
        if k < 4:
            f.path(f'M{xs[k] + 64},76 Q{xs[k] + 85},52 {xs[k] + 106},76', 'ln', 'm')
            f.path(f'M{xs[k] + 106},146 Q{xs[k] + 85},170 {xs[k] + 64},146', 'lna', 'a')
    f.text(280, 30, 'forward q: add a little Gaussian noise each step (fixed)', 'xs mut')
    f.text(280, 196, 'reverse p_θ: a network predicts the noise and removes it (learned)', 'xs acc')
    f.text(280, 222, 'generation = start from pure noise x_T and run the reverse chain', 'xs mut')
    f.done()


def flow_matching():
    r = np.random.default_rng(4)
    z = r.normal(0, 0.6, (60, 2)) + np.array([-3, 0])
    t = r.uniform(0, np.pi, 60); side = r.integers(0, 2, 60)
    x1 = np.where(side[:, None] == 0, np.c_[np.cos(t), np.sin(t)], np.c_[1 - np.cos(t), 0.5 - np.sin(t)]) * 1.0 + np.array([2.2, -0.2])
    f = P('flow_matching', 480, 260, 'Flow matching learns a velocity field that carries noise to data', (-5, 5), (-2.2, 2.2), pad=(10, 10, 10, 26))
    for i in range(0, 60, 3):
        f.curve([z[i, 0], x1[i, 0]], [z[i, 1], x1[i, 1]], 'sthin')
    f.dots(z[:, 0], z[:, 1], 'f2', 3); f.dots(x1[:, 0], x1[:, 1], 'f1', 3)
    f.text(f.X(-3), f.h - 12, 'noise (t = 0)', 'xs tc2'); f.text(f.X(2.6), f.h - 12, 'data (t = 1)', 'xs tc1')
    f.done()


def rl_loop():
    f = F('rl_loop', 440, 250, 'The reinforcement learning loop')
    f.rect(140, 20, 160, 60, 'bacc', 12, 'Agent', 'b', 'policy π(a|s)')
    f.rect(140, 170, 160, 60, 'b3', 12, 'Environment', 'b', 'P(s′|s,a), R')
    f.path('M300,50 L380,50 L380,200 L302,200', 'lna', 'a'); f.text(392, 125, 'action aₜ', 'sm acc', anchor='start')
    f.path('M140,200 L60,200 L60,50 L138,50', 'lc2', 'c2'); f.text(72, 115, 'state sₜ₊₁', 'sm tc2', anchor='start')
    f.text(72, 137, 'reward rₜ₊₁', 'sm tc2', anchor='start')
    f.done()


def gridworld():
    n = 4; gamma = 0.9; step = -0.04
    goal, pit, wall = (0, 3), (1, 3), (1, 1)
    V = np.zeros((n, n)); acts = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    def nxt(s, a):
        r, c = s[0] + a[0], s[1] + a[1]
        if 0 <= r < n and 0 <= c < n and (r, c) != wall:
            return (r, c)
        return s
    for _ in range(200):
        V2 = V.copy()
        for r in range(n):
            for c in range(n):
                s = (r, c)
                if s in (goal, pit, wall):
                    continue
                V2[r, c] = max(step + gamma * (1 if nxt(s, a) == goal else -1 if nxt(s, a) == pit else V[nxt(s, a)]) for a in acts)
        V = V2
    f = F('gridworld', 340, 340, 'Value iteration on a 4×4 grid world')
    cs = 70; ox, oy = 30, 20
    arrows = {(-1, 0): '↑', (1, 0): '↓', (0, -1): '←', (0, 1): '→'}
    for r in range(n):
        for c in range(n):
            x, y = ox + c * cs, oy + r * cs; s = (r, c)
            if s == wall:
                f.rect(x, y, cs - 3, cs - 3, 'masked', 6); continue
            if s == goal:
                f.rect(x, y, cs - 3, cs - 3, 'b3', 6, '+1', 'b'); continue
            if s == pit:
                f.rect(x, y, cs - 3, cs - 3, 'b5', 6, '−1', 'b'); continue
            f.rect(x, y, cs - 3, cs - 3, 'heat', 6, op=0.1 + 0.8 * max(V[r, c], 0))
            best = max(acts, key=lambda a: (1 if nxt(s, a) == goal else -1 if nxt(s, a) == pit else V[nxt(s, a)]))
            f.text(x + cs / 2 - 1, y + 24, arrows[best], 'lg b' + (' wht' if V[r, c] > 0.6 else ''))
            f.text(x + cs / 2 - 1, y + 48, f'{V[r, c]:.2f}', 'xs' + (' wht' if V[r, c] > 0.6 else ''))
    f.text(170, 316, 'numbers: V*(s) · arrows: greedy policy · γ = 0.9', 'xs mut')
    f.done()


def gpu_mem():
    f = F('gpu_mem', 520, 290, 'The GPU memory hierarchy: small and fast at the top, large and slow at the bottom')
    lv = [('Reg.', 'registers: per thread, fastest'), ('SRAM (shared / L1)', '~tens of MB total, ~10+ TB/s'),
          ('HBM (GPU memory)', '~80–200 GB, a few TB/s'), ('CPU RAM / NVMe', 'TBs, 10–100× slower')]
    cls = ['b5', 'b2', 'bacc', 'b4']
    for i, (t, sub) in enumerate(lv):
        top = 14 + i * 66; wt = 40 + i * 75; wb = 40 + (i + 1) * 75; cx = 172
        f.poly([(cx - wt / 2, top), (cx + wt / 2, top), (cx + wb / 2, top + 60), (cx - wb / 2, top + 60)], cls[i])
        f.text(cx, top + 32, t, 'xs b')
        f.text(cx + wb / 2 + 12, top + 32, sub, 'xs mut', anchor='start')
    f.done()


def roofline():
    f = P('roofline', 480, 300, 'Roofline: is a kernel limited by memory bandwidth or by compute?', (-1, 3), (-0.5, 3.5))
    f.axes([-1, 0, 1, 2, 3], [0, 1, 2, 3], 'arithmetic intensity (FLOPs / byte)', 'TFLOP/s',
           xf=lambda v: f'{10 ** v:g}', yf=lambda v: f'{10 ** v:g}')
    ai = np.linspace(-1, 3, 300); perf = np.log10(np.minimum(1000, 3.35 * 10 ** ai))
    f.curve(ai, perf, 's1')
    for x, lab, cls in [(math.log10(0.25), 'elementwise op', 'f5'), (math.log10(1.5), 'LLM decode (batch 1)', 'f2'), (math.log10(600), 'large matmul', 'f3')]:
        y = math.log10(min(1000, 3.35 * 10 ** x)) - 0.12
        f.dots([x], [y], cls, 5.5); f.text(f.X(x) + (8 if x < 2 else -10), f.Y(y) - (14 if x < 2 else -2), lab, 'xs', anchor='start' if x < 2 else 'end')
    f.text(f.X(0.2), f.Y(1.6), 'memory-bound', 'sm tc1', rot=-38); f.text(f.X(2.4), f.Y(3.25), 'compute-bound', 'sm tc1')
    f.done()


def parallelism():
    f = F('parallelism', 500, 490, 'Data, tensor and pipeline parallelism')
    f.text(250, 16, 'Data parallel: full model copy per GPU, split the batch', 'sm b')
    for i in range(3):
        x = 30 + i * 160
        f.rect(x, 32, 130, 54, 'bacc', 8, f'GPU {i}: model', 'sm', f'batch shard {i}')
    f.rect(30, 98, 450, 30, 'b2', 8, 'all-reduce: average gradients', 'xs')
    f.text(250, 160, 'Tensor parallel: split each weight matrix across GPUs', 'sm b')
    f.rect(90, 178, 150, 80, 'b3', 6, 'W[:, :k/2]', 'sm', 'GPU 0'); f.rect(260, 178, 150, 80, 'b3', 6, 'W[:, k/2:]', 'sm', 'GPU 1')
    f.text(250, 274, 'outputs gathered every layer (needs fast interconnect)', 'xs mut')
    f.text(250, 306, 'Pipeline parallel: different layers on different GPUs', 'sm b')
    for i in range(4):
        f.rect(20 + i * 120, 324, 104, 40, 'b4', 8, f'layers {i * 8 + 1}–{i * 8 + 8}', 'xs', f'GPU {i}')
        if i < 3:
            f.line(124 + i * 120, 344, 138 + i * 120, 344, 'ln', 'm')
    for s in range(4):
        for mb in range(4):
            f.rect(20 + (s + mb) * 52, 384 + s * 18, 48, 15, ['bacc', 'b2', 'b3', 'b5'][mb], 3, f'mb{mb}', 'xs')
    f.text(250, 470, 'micro-batches (mb) flow through the stages; empty slots are the pipeline "bubble"', 'xs mut')
    f.done()


def zero():
    f = F('zero', 480, 230, 'Memory per GPU for a 7B model on 8 GPUs')
    rows = [('DDP', 112), ('ZeRO-1', 38.5), ('ZeRO-2', 26.3), ('ZeRO-3 / FSDP', 14)]
    for i, (lab, gb) in enumerate(rows):
        y = 20 + i * 48
        f.text(110, y + 16, lab, 'sm', anchor='end')
        f.rect(120, y, gb * 2.8, 32, ['b5', 'b2', 'bacc', 'b3'][i], 4)
        f.text(126 + gb * 2.8, y + 16, f'{gb:g} GB', 'sm b', anchor='start')
    f.text(240, 216, 'shard optimizer states → + gradients → + weights (params, before activations)', 'xs mut')
    f.done()


def two_tower():
    f = F('two_tower', 480, 300, 'Two-tower retrieval model for recommendations')
    f.rect(30, 220, 160, 44, 'b2', 8, 'user features', 'sm'); f.rect(290, 220, 160, 44, 'b4', 8, 'item features', 'sm')
    f.rect(50, 130, 120, 60, 'bacc', 8, 'user tower', 'sm', 'MLP'); f.rect(310, 130, 120, 60, 'bacc', 8, 'item tower', 'sm', 'MLP')
    f.rect(70, 60, 80, 36, 'b3', 8, 'u', 'b'); f.rect(330, 60, 80, 36, 'b3', 8, 'v', 'b')
    for x in (110, 370):
        f.line(x, 220, x, 192, 'ln', 'm'); f.line(x, 130, x, 98, 'ln', 'm')
    f.circ(240, 40, 22, 'node', 'u·v', 'sm')
    f.line(150, 70, 217, 46, 'ln', 'm'); f.line(330, 70, 263, 46, 'ln', 'm')
    f.text(240, 82, 'score', 'xs mut'); f.text(240, 290, 'item vectors are pre-computed and stored in an ANN index', 'xs mut')
    f.done()


def sysdesign():
    f = F('sysdesign', 480, 330, 'The ML system design loop')
    steps = [('1. Problem + metrics', 'b2'), ('2. Data', 'bacc'), ('3. Features', 'bacc'), ('4. Model', 'bacc'),
             ('5. Offline evaluation', 'b4'), ('6. Serving', 'b3'), ('7. Online A/B test', 'b3'), ('8. Monitoring', 'b5')]
    L = steps[:4]; R = steps[4:][::-1]
    for i, (t, c) in enumerate(L):
        f.rect(20, 20 + i * 76, 190, 46, c, 10, t, 'sm')
        if i < 3:
            f.line(115, 66 + i * 76, 115, 94 + i * 76, 'ln', 'm')
    for i, (t, c) in enumerate(R):
        f.rect(270, 20 + i * 76, 190, 46, c, 10, t, 'sm')
        if i < 3:
            f.line(365, 94 + i * 76, 365, 66 + i * 76, 'ln', 'm')
    f.line(210, 271, 268, 271, 'ln', 'm')
    f.path('M270,43 L240,43 L240,119 L212,119', 'lc5 dash', 'c5'); f.text(252, 80, 'retrain', 'xs tc5', rot=90)
    f.done()


def reasoning():
    f = F('reasoning', 480, 280, 'Self-consistency: sample several reasoning chains and vote')
    f.rect(170, 10, 140, 40, 'b2', 8, 'question', 'sm')
    ans = ['42', '42', '17', '42']
    for i, a in enumerate(ans):
        x = 14 + i * 118
        f.rect(x, 90, 100, 70, 'bacc' if a == '42' else 'b5', 8, f'chain {i + 1}', 'xs', f'answer: {a}')
        f.line(240, 50, x + 50, 88, 'ln', 'm'); f.line(x + 50, 160, 240, 204, 'ln', 'm')
    f.rect(170, 206, 140, 40, 'b3', 8, 'majority vote → 42', 'sm')
    f.text(240, 266, 'more test-time compute → more reliable answers', 'xs mut')
    f.done()


def multimodal_llm():
    f = F('multimodal_llm', 520, 240, 'A vision-language model')
    f.rect(10, 20, 70, 60, 'heat', 6, op=0.45); f.text(45, 92, 'image', 'xs mut')
    f.rect(100, 20, 110, 60, 'b4', 8, 'vision encoder', 'xs', '(ViT)')
    f.rect(230, 20, 90, 60, 'b2', 8, 'projector', 'xs', '(MLP)')
    f.line(80, 50, 98, 50, 'ln', 'm'); f.line(210, 50, 228, 50, 'ln', 'm')
    toks = [('v₁', 'b2'), ('v₂', 'b2'), ('v₃', 'b2'), ('What', 'bacc'), ('is', 'bacc'), ('this?', 'bacc')]
    for i, (t, c) in enumerate(toks):
        f.rect(110 + i * 58, 116, 52, 30, c, 6, t, 'xs')
    f.path('M275,80 L275,98 L190,98 L190,114', 'ln', 'm')
    f.rect(110, 180, 340, 40, 'b3', 10, 'LLM decoder → "A cat sitting on a mat"', 'sm')
    f.line(280, 146, 280, 178, 'ln', 'm')
    f.text(168, 158, 'image tokens', 'xs mut'); f.text(372, 158, 'text tokens', 'xs mut')
    f.done()


def llmops():
    f = vflow('llmops', 'Request path of a production LLM application', [
        ('Request', 'auth, rate limits, input validation', 'b2'),
        ('Cache lookup', 'exact or semantic cache hit → return early', 'box'),
        ('Router', 'small model for easy, large model for hard', 'bacc'),
        ('Context assembly', 'system prompt + retrieved docs + history', 'box'),
        ('LLM call', 'streaming, timeouts, retries, fallbacks', 'b4'),
        ('Output checks', 'schema validation, guardrails, citations', 'b5'),
        ('Response + logging', 'traces, cost, latency, user feedback → evals', 'b3')], w=460, bw=360, bh=46, gap=22)
    f.done()


def ALL():
    for fn in [llm_pipeline, scaling_law, lora, rlhf, kvcache, moe, memory_breakdown, rag_pipeline, hnsw, agent_loop,
               vae, gan, diffusion, flow_matching, rl_loop, gridworld, gpu_mem, roofline, parallelism, zero, two_tower,
               sysdesign, reasoning, multimodal_llm, llmops]:
        fn()
    funnel('retrieval_funnel', 'Retrieval funnel: cheap and broad first, expensive and precise last',
           [('All documents', 'millions of chunks'), ('Hybrid retrieval', 'BM25 + dense → top 100'),
            ('Cross-encoder rerank', 'top 100 → top 10'), ('LLM context', '3–8 best passages')])
    funnel('recsys_funnel', 'Recommendation funnel', [('Item catalog', '~10⁷–10⁹ items'), ('Candidate generation', 'two-tower + ANN → ~1,000'),
           ('Ranking', 'heavy model, rich features → ~100'), ('Re-ranking', 'diversity, freshness, rules → ~20')])
