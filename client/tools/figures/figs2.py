"""Deep learning, vision and NLP figures."""
import math
import numpy as np
from fig_lib import F, P, Phi

rng = np.random.default_rng(11)


def neuron():
    f = F('neuron', 480, 250, 'A single artificial neuron')
    ys = [50, 120, 190]
    for i, y in enumerate(ys):
        f.circ(50, y, 20, 'node n2', f'x{"₁₂₃"[i]}')
    f.circ(250, 120, 30, 'node', 'Σ', 'lg')
    for i, y in enumerate(ys):
        dx, dy = 250 - 50, 120 - y; L = math.hypot(dx, dy)
        f.line(50 + 20 * dx / L, y + 20 * dy / L, 250 - 30 * dx / L, 120 - 30 * dy / L, 'ln', 'm')
        f.text(150, (y + 120) / 2 - 14, f'w{"₁₂₃"[i]}', 'sm acc')
    f.line(250, 30, 250, 88, 'ln', 'm'); f.text(250, 20, 'bias b', 'sm mut')
    f.rect(312, 95, 66, 50, 'bacc', 10, 'φ', 'lg')
    f.line(280, 120, 310, 120, 'ln', 'm'); f.line(378, 120, 430, 120, 'ln', 'm')
    f.text(452, 120, 'ŷ', 'lg b')
    f.text(250, 172, 'z = wᵀx + b', 'sm'); f.text(345, 160, 'activation', 'xs mut')
    f.text(240, 232, 'ŷ = φ(w₁x₁ + w₂x₂ + w₃x₃ + b)', 'sm b')
    f.done()


def mlp():
    f = F('mlp', 520, 320, 'A multilayer perceptron with two hidden layers')
    sizes = [3, 5, 5, 2]; xs = [70, 200, 330, 450]
    def ypos(n): return [160 + (i - (n - 1) / 2) * 50 for i in range(n)]
    for l in range(3):
        for y1 in ypos(sizes[l]):
            for y2 in ypos(sizes[l + 1]):
                f.line(xs[l] + 15, y1, xs[l + 1] - 15, y2, 'ln thin')
    cls = ['node n2', 'node', 'node', 'node n3']
    for l, n in enumerate(sizes):
        for y in ypos(n):
            f.circ(xs[l], y, 15, cls[l])
    for l, lab in enumerate(['input x', 'hidden h⁽¹⁾', 'hidden h⁽²⁾', 'output ŷ']):
        f.text(xs[l], 300, lab, 'sm')
    for l, lab in enumerate(['W⁽¹⁾, b⁽¹⁾', 'W⁽²⁾, b⁽²⁾', 'W⁽³⁾, b⁽³⁾']):
        f.text((xs[l] + xs[l + 1]) / 2, 22, lab, 'sm acc')
    f.done()


def activations():
    f = P('activations', 480, 300, 'Common activation functions', (-4, 4), (-1.3, 3.2))
    f.axes([-4, -2, 0, 2, 4], [-1, 0, 1, 2, 3], 'z', 'φ(z)')
    x = np.linspace(-4, 4, 300); erf = np.vectorize(math.erf)
    f.curve(x, 1 / (1 + np.exp(-x)), 's1'); f.curve(x, np.tanh(x), 's2')
    f.curve(x, np.maximum(0, x), 's3'); f.curve(x, 0.5 * x * (1 + erf(x / math.sqrt(2))), 's4', dash=True)
    f.legend([('s1', 'sigmoid'), ('s2', 'tanh'), ('s3', 'ReLU'), ('s4 dash', 'GELU')], 66, 30)
    f.done()


def act_derivs():
    f = P('act_derivs', 480, 280, 'Derivatives of the activation functions', (-4, 4), (-0.15, 1.25))
    f.axes([-4, -2, 0, 2, 4], [0, 0.25, 0.5, 1], 'z', "φ'(z)")
    x = np.linspace(-4, 4, 400); s = 1 / (1 + np.exp(-x)); erf = np.vectorize(math.erf)
    pdf = np.exp(-x ** 2 / 2) / math.sqrt(2 * math.pi)
    f.curve(x, s * (1 - s), 's1'); f.curve(x, 1 - np.tanh(x) ** 2, 's2')
    f.curve(x, (x > 0).astype(float), 's3'); f.curve(x, 0.5 * (1 + erf(x / math.sqrt(2))) + x * pdf, 's4', dash=True)
    f.text(f.X(0) + 6, f.Y(0.25) - 10, 'sigmoid max = 0.25', 'xs tc1', anchor='start')
    f.legend([('s1', 'sigmoid'), ('s2', 'tanh'), ('s3', 'ReLU'), ('s4 dash', 'GELU')], 66, 30)
    f.done()


def compgraph():
    f = F('compgraph', 540, 290, 'Forward values and backward gradients on a computational graph')
    f.circ(50, 40, 22, 'node n2', 'x', 'b'); f.circ(50, 150, 22, 'node n2', 'y', 'b'); f.circ(50, 240, 22, 'node n2', 'z', 'b')
    f.circ(240, 95, 24, 'node', '×', 'lg'); f.circ(390, 170, 24, 'node', '+', 'lg'); f.circ(495, 170, 22, 'node n3', 'f', 'b')
    f.line(72, 46, 217, 88, 'ln', 'm'); f.line(72, 144, 217, 103, 'ln', 'm')
    f.line(262, 106, 368, 160, 'ln', 'm'); f.line(72, 236, 367, 177, 'ln', 'm'); f.line(414, 170, 471, 170, 'ln', 'm')
    f.text(120, 38, 'x = 2', 'sm tc3', anchor='start'); f.text(118, 84, '∂f/∂x = −3', 'xs tc5')
    f.text(108, 114, 'y = −3', 'sm tc3'); f.text(132, 152, '∂f/∂y = 2', 'xs tc5')
    f.text(302, 110, 'q = −6', 'sm tc3', anchor='end'); f.text(322, 160, '∂f/∂q = 1', 'xs tc5', anchor='start')
    f.text(200, 194, 'z = 4', 'sm tc3'); f.text(222, 228, '∂f/∂z = 1', 'xs tc5')
    f.text(442, 154, 'f = −2', 'sm tc3'); f.text(442, 188, '1', 'sm tc5')
    f.text(270, 276, 'green: forward values · red: gradients flowing back', 'xs mut')
    f.done()


def backprop_flow():
    f = F('backprop_flow', 520, 500, 'Forward and backward pass through a two-layer network')
    boxes = [('Input x', None, 'box'), ('Linear: z₁ = W₁x + b₁', '∂L/∂W₁ = δ₁ xᵀ', 'bacc'),
             ('ReLU: h = max(0, z₁)', None, 'box'), ('Linear: z₂ = W₂h + b₂', '∂L/∂W₂ = δ₂ hᵀ', 'bacc'),
             ('Softmax: p = softmax(z₂)', None, 'box'), ('Loss: L = −log p_y', None, 'b5')]
    for i, (t, t2, c) in enumerate(boxes):
        f.rect(30, 18 + 80 * i, 260, 50, c, 10, t, '', t2, t2cls='sm tc5')
    gaps = ['∂L/∂x = W₁ᵀδ₁', 'δ₁ = (W₂ᵀδ₂) ⊙ 1[z₁ > 0]', '∂L/∂h = W₂ᵀδ₂', 'δ₂ = p − y', '∂L/∂L = 1']
    for i in range(5):
        top = 68 + 80 * i; bot = 98 + 80 * i
        f.line(70, top, 70, bot, 'lna', 'a'); f.line(250, bot, 250, top, 'lc5', 'c5')
        f.text(305, 83 + 80 * i, gaps[i], 'sm tc5', anchor='start')
    f.text(305, 26, '↓ forward pass', 'sm acc', anchor='start'); f.text(305, 46, '↑ backward pass', 'sm tc5', anchor='start')
    f.done()


def dropout():
    f = F('dropout', 520, 250, 'Dropout randomly removes units during training')
    sizes = [3, 4, 4, 2]
    def ypos(n): return [135 + (i - (n - 1) / 2) * 40 for i in range(n)]
    for off, title, drop in [(0, 'Standard network', set()), (260, 'With dropout (p = 0.5)', {(1, 1), (1, 3), (2, 0), (2, 2)})]:
        xs = [off + 40, off + 100, off + 160, off + 220]
        f.text(off + 130, 20, title, 'sm b')
        for l in range(3):
            for i, y1 in enumerate(ypos(sizes[l])):
                for j, y2 in enumerate(ypos(sizes[l + 1])):
                    if (l, i) in drop or (l + 1, j) in drop:
                        continue
                    f.line(xs[l] + 11, y1, xs[l + 1] - 11, y2, 'ln thin')
        for l, n in enumerate(sizes):
            for i, y in enumerate(ypos(n)):
                if (l, i) in drop:
                    f.circ(xs[l], y, 11, 'dropped'); f.text(xs[l], y, '×', 'sm mut')
                else:
                    f.circ(xs[l], y, 11, 'node')
    f.done()


def norms():
    f = F('norms', 500, 250, 'BatchNorm vs LayerNorm: which values share statistics')
    for ox, title, mode in [(40, 'BatchNorm', 'col'), (290, 'LayerNorm', 'row')]:
        f.text(ox + 91, 22, title, 'b')
        for r in range(6):
            for c in range(7):
                hl = (mode == 'col' and c == 2) or (mode == 'row' and r == 3)
                f.rect(ox + c * 26, 44 + r * 22, 24, 20, 'heat' if hl else 'box', 3, op=0.85 if hl else None)
        f.text(ox + 91, 192, 'features →', 'xs mut'); f.text(ox - 12, 110, 'examples →', 'xs mut', rot=90)
        f.text(ox + 91, 214, 'stats over the batch, per feature' if mode == 'col' else 'stats over features, per example', 'xs')
    f.text(250, 240, 'CNNs: BatchNorm · Transformers: LayerNorm / RMSNorm', 'xs mut')
    f.done()


def conv_op():
    f = F('conv_op', 480, 240, 'A 3×3 convolution sliding over a 5×5 input')
    inp = np.array([[3, 3, 3, 0, 0]] * 5); ker = np.array([[1, 0, -1]] * 3)
    out = np.array([[(inp[i:i + 3, j:j + 3] * ker).sum() for j in range(3)] for i in range(3)])
    c = 28
    f.text(86, 26, 'Input 5×5', 'sm b'); f.text(238, 54, 'Kernel 3×3', 'sm b'); f.text(388, 54, 'Output 3×3', 'sm b')
    for i in range(5):
        for j in range(5):
            f.rect(16 + j * c, 42 + i * c, c, c, 'cell', 0, str(inp[i, j]), 'sm')
    f.rect(16, 42, 3 * c, 3 * c, 'hl', 2)
    for i in range(3):
        for j in range(3):
            f.rect(196 + j * c, 72 + i * c, c, c, 'cell k', 0, str(ker[i, j]), 'sm')
            f.rect(346 + j * c, 72 + i * c, c, c, 'cell' + (' o' if i == 0 and j == 0 else ''), 0, str(out[i, j]), 'sm b')
    f.text(176, 114, '∗', 'lg'); f.text(326, 114, '=', 'lg')
    f.text(240, 206, 'out[i,j] = Σₘ Σₙ input[i+m, j+n] · kernel[m,n]', 'sm')
    f.text(240, 228, 'this kernel responds to vertical edges (bright → dark)', 'xs mut')
    f.done()


def maxpool():
    f = F('maxpool', 420, 190, '2×2 max pooling with stride 2')
    v = np.array([[1, 3, 2, 1], [4, 6, 5, 0], [3, 1, 1, 2], [2, 2, 7, 4]])
    q = [['bacc', 'b2'], ['b3', 'b4']]; c = 34
    for i in range(4):
        for j in range(4):
            f.rect(20 + j * c, 30 + i * c, c, c, q[i // 2][j // 2], 0, str(v[i, j]), 'sm')
    f.line(180, 98, 250, 98, 'ln', 'm'); f.text(215, 84, 'max', 'xs mut')
    for i in range(2):
        for j in range(2):
            m = v[2 * i:2 * i + 2, 2 * j:2 * j + 2].max()
            f.rect(270 + j * 44, 54 + i * 44, 44, 44, q[i][j], 0, str(m), 'b')
    f.text(210, 178, 'halves width and height, keeps the strongest response', 'xs mut')
    f.done()


def cnn_pipeline():
    f = F('cnn_pipeline', 600, 240, 'A typical CNN: feature maps shrink in space and grow in channels')
    items = [('Input', '32×32×3', 8, 110, 'b2'), ('Conv+ReLU', '32×32×32', 22, 110, 'bacc'), ('Pool', '16×16×32', 22, 60, 'bacc'),
             ('Conv+ReLU', '16×16×64', 36, 60, 'bacc'), ('Pool', '8×8×64', 36, 32, 'bacc'), ('FC', '128', 10, 90, 'b4'),
             ('Softmax', '10', 10, 40, 'b3')]
    xs = [20, 90, 172, 252, 340, 432, 524]; cy = 105
    for (lab, shp, w, h, cls), x in zip(items, xs):
        o = h * 0.28
        y = cy - h / 2
        f.poly([(x, y), (x + o, y - o * 0.7), (x + o + w, y - o * 0.7), (x + w, y)], cls + ' top')
        f.poly([(x + w, y), (x + w + o, y - o * 0.7), (x + w + o, y + h - o * 0.7), (x + w, y + h)], cls + ' side')
        f.rect(x, y, w, h, cls, 1)
        f.text(x + (w + o) / 2, 192, lab, 'xs b'); f.text(x + (w + o) / 2, 208, shp, 'xs mut')
    for a, b in zip(xs[:-1], xs[1:]):
        pass
    f.text(300, 232, 'spatial size ↓ · channels ↑ · then classify', 'xs mut')
    f.done()


def resblock():
    f = F('resblock', 360, 400, 'A residual block')
    f.text(150, 22, 'x', 'lg b')
    f.line(150, 34, 150, 68, 'ln', 'm')
    f.rect(55, 70, 190, 46, 'bacc', 10, 'conv 3×3 → BN → ReLU')
    f.line(150, 116, 150, 158, 'ln', 'm')
    f.rect(55, 160, 190, 46, 'bacc', 10, 'conv 3×3 → BN')
    f.line(150, 206, 150, 250, 'ln', 'm')
    f.circ(150, 266, 16, 'node', '+', 'lg')
    f.path('M150,44 L300,44 L300,266 L168,266', 'lc2', 'c2')
    f.text(318, 155, 'identity shortcut', 'sm tc2', rot=90)
    f.text(40, 138, 'F(x)', 'sm acc', anchor='end')
    f.line(150, 282, 150, 308, 'ln', 'm')
    f.rect(95, 310, 110, 36, 'box', 10, 'ReLU')
    f.line(150, 346, 150, 368, 'ln', 'm')
    f.text(150, 386, 'y = F(x) + x', 'b')
    f.done()


def rnn_unrolled():
    f = F('rnn_unrolled', 560, 230, 'A recurrent network, folded and unrolled through time')
    def cell(x, sub):
        f.rect(x, 90, 60, 50, 'bacc', 10, 'A', 'b')
        f.line(x + 30, 188, x + 30, 142, 'ln', 'm'); f.text(x + 30, 204, f'x{sub}', 'sm')
        f.line(x + 30, 90, x + 30, 44, 'ln', 'm'); f.text(x + 30, 30, f'h{sub}', 'sm')
    cell(30, 'ₜ')
    f.path('M90,104 C130,84 130,148 92,128', 'lc2', 'c2')
    f.text(160, 115, '=', 'lg')
    subs = ['₀', '₁', '₂', '₃']
    for i, x in enumerate([195, 285, 375, 465]):
        cell(x, subs[i])
        if i < 3:
            f.line(x + 60, 115, x + 88, 115, 'lc2', 'c2')
    f.text(330, 222, 'the same weights A are reused at every time step', 'xs mut')
    f.done()


def lstm_cell():
    f = F('lstm_cell', 540, 300, 'Inside an LSTM cell')
    f.rect(60, 36, 410, 210, 'pnl', 16)
    f.line(20, 70, 520, 70, 'lc4 thick', 'c4')
    f.text(26, 54, 'cₜ₋₁', 'sm', anchor='start'); f.text(514, 54, 'cₜ', 'sm', anchor='end')
    f.circ(150, 70, 13, 'node op', '×'); f.circ(260, 70, 13, 'node op', '+')
    gates = [(150, 'σ', 'fₜ'), (230, 'σ', 'iₜ'), (290, 'tanh', 'c̃ₜ'), (380, 'σ', 'oₜ')]
    f.line(20, 265, 380, 265, 'ln')
    f.text(24, 282, 'hₜ₋₁', 'sm', anchor='start')
    f.line(105, 298, 105, 267, 'ln', 'm'); f.text(117, 290, 'xₜ', 'sm', anchor='start')
    for (x, lab, name) in gates:
        f.line(x, 265, x, 216, 'ln', 'm')
        f.rect(x - 24, 180, 48, 34, 'b2' if lab == 'σ' else 'b3', 8, lab, 'sm b')
        f.text(x + 30, 222, name, 'xs mut', anchor='start')
    f.line(150, 180, 150, 85, 'ln', 'm')
    f.circ(260, 130, 13, 'node op', '×')
    f.path('M230,180 L230,130 L245,130', 'ln', 'm'); f.path('M290,180 L290,130 L275,130', 'ln', 'm')
    f.line(260, 117, 260, 85, 'ln', 'm')
    f.line(440, 70, 440, 112, 'ln', 'm'); f.circ(440, 128, 15, 'node b3c', 'tanh', 'xs')
    f.line(440, 143, 440, 182, 'ln', 'm'); f.circ(440, 197, 13, 'node op', '×')
    f.path('M380,180 L380,197 L425,197', 'ln', 'm')
    f.line(453, 197, 520, 197, 'ln', 'm'); f.text(514, 214, 'hₜ', 'sm', anchor='end')
    f.text(350, 92, 'cell state: additive updates', 'xs tc4')
    f.done()


def attention():
    f = F('attention', 460, 480, 'Scaled dot-product attention, step by step')
    f.rect(155, 14, 150, 40, 'b2', 10, 'X  (n × d)')
    for x, t in [(20, 'Q = X W_Q'), (170, 'K = X W_K'), (320, 'V = X W_V')]:
        f.rect(x, 92, 120, 44, 'bacc', 10, t, 'sm')
        f.line(230, 54, x + 60, 90, 'ln', 'm')
    f.rect(40, 172, 250, 46, 'box', 10, 'S = Q Kᵀ / √d_k', '', 'n × n similarity scores')
    f.line(80, 136, 110, 170, 'ln', 'm'); f.line(230, 136, 210, 170, 'ln', 'm')
    f.rect(40, 248, 250, 44, 'box', 10, 'S + M  (causal mask)')
    f.rect(40, 322, 250, 46, 'box', 10, 'A = softmax(S), row-wise', '', 'each row sums to 1')
    f.rect(40, 400, 250, 46, 'b3', 10, 'Output = A V', '', 'n × d_v')
    for a, b in [(218, 246), (292, 320), (368, 398)]:
        f.line(165, a, 165, b, 'ln', 'm')
    f.path('M380,136 L380,423 L292,423', 'ln', 'm')
    f.text(392, 280, 'values', 'xs mut', anchor='start')
    f.done()


def attn_heatmap():
    toks = ['The', 'cat', 'sat', 'on', 'the', 'mat']
    Wm = [[1], [.35, .65], [.1, .65, .25], [.05, .2, .55, .2], [.3, .05, .1, .35, .2], [.08, .37, .15, .2, .12, .08]]
    f = F('attn_heatmap', 420, 420, 'Causal attention weights: each token attends only to itself and earlier tokens')
    ox, oy, c = 100, 90, 50
    f.text(250, 40, 'keys (attended to) →', 'sm mut')
    f.text(40, 240, 'queries →', 'sm mut', rot=90)
    for j, t in enumerate(toks):
        f.text(ox + j * c + c / 2, 74, t, 'sm')
    for i, t in enumerate(toks):
        f.text(ox - 8, oy + i * c + c / 2, t, 'sm', anchor='end')
        for j in range(6):
            if j > i:
                f.rect(ox + j * c, oy + i * c, c - 2, c - 2, 'masked', 3)
            else:
                w = Wm[i][j]
                f.rect(ox + j * c, oy + i * c, c - 2, c - 2, 'heat', 3, op=0.12 + 0.88 * w)
                f.text(ox + j * c + c / 2 - 1, oy + i * c + c / 2 - 1, f'{w:.2f}', 'xs' + (' wht' if w > 0.45 else ''))
    f.text(250, 404, 'grey = masked future positions · rows sum to 1', 'xs mut')
    f.done()


def multihead():
    f = F('multihead', 480, 330, 'Multi-head attention runs several attention heads in parallel')
    f.rect(180, 12, 120, 38, 'b2', 10, 'X')
    for i, x in enumerate([15, 175, 335]):
        f.rect(x, 90, 130, 58, 'bacc', 10, f'Head {i + 1}', 'b', 'own W_Q, W_K, W_V', t2cls='xs mut')
        f.line(240, 50, x + 65, 88, 'ln', 'm'); f.line(x + 65, 148, 240, 188, 'ln', 'm')
    f.rect(90, 190, 300, 40, 'box', 10, 'Concat(head₁, …, head_h)')
    f.line(240, 230, 240, 254, 'ln', 'm')
    f.rect(140, 256, 200, 40, 'b3', 10, 'Linear W_O')
    f.line(240, 296, 240, 312, 'ln', 'm'); f.text(240, 322, 'output (n × d)', 'sm')
    f.done()


def transformer_block():
    f = F('transformer_block', 420, 600, 'A decoder-only Transformer (pre-norm)')
    cx = 210
    def box(y, h, t, cls='box', t2=None):
        f.rect(90, y, 240, h, cls, 10, t, 'sm', t2)
    f.text(cx, 580, 'input tokens', 'sm mut')
    f.line(cx, 568, cx, 530, 'ln', 'm')
    box(488, 40, 'Token embedding + position', 'b2')
    f.rect(55, 150, 310, 322, 'pnl dashf', 16); f.text(388, 310, '× N blocks', 'sm b', rot=90)
    box(420, 34, 'LayerNorm'); box(364, 40, 'Masked multi-head attention', 'bacc')
    f.circ(cx, 322, 13, 'node', '+'); box(262, 34, 'LayerNorm'); box(206, 40, 'Feed-forward (MLP)', 'b3')
    f.circ(cx, 166, 13, 'node', '+')
    box(100, 34, 'LayerNorm'); box(48, 34, 'Linear → vocabulary logits', 'b4')
    f.text(cx, 20, 'softmax → p(next token)', 'sm b')
    for a, b in [(488, 456), (420, 406), (364, 337), (309, 298), (262, 248), (206, 181), (153, 136), (100, 84), (48, 32)]:
        f.line(cx, a, cx, b, 'ln', 'm')
    f.path(f'M{cx},474 L80,474 L80,322 L{cx - 15},322', 'lc2', 'c2')
    f.path(f'M{cx},304 L80,304 L80,166 L{cx - 15},166', 'lc2', 'c2')
    f.text(70, 400, 'residual', 'xs tc2', rot=-90)
    f.done()


def posenc():
    f = F('posenc', 460, 300, 'Sinusoidal positional encodings')
    npos, d = 24, 32; ox, oy, cw, ch = 60, 26, 11, 9
    for p in range(npos):
        for i in range(d):
            k = i // 2; ang = p / (10000 ** (2 * k / d))
            v = math.sin(ang) if i % 2 == 0 else math.cos(ang)
            f.add(f'<rect x="{ox + i * cw}" y="{oy + p * ch}" width="{cw}" height="{ch}" class="{"heat" if v >= 0 else "heat2"}" opacity="{abs(v):.2f}"/>')
    f.text(ox + d * cw / 2, oy + npos * ch + 18, 'embedding dimension i → (fast → slow oscillation)', 'xs mut')
    f.text(ox - 18, oy + npos * ch / 2, 'position →', 'xs mut', rot=90)
    f.rect(330, 270, 12, 10, 'heat', 2); f.text(348, 275, '+', 'xs', anchor='start')
    f.rect(370, 270, 12, 10, 'heat2', 2); f.text(388, 275, '−', 'xs', anchor='start')
    f.done()


def gnn():
    f = F('gnn', 460, 270, 'Message passing in a graph neural network')
    V = (230, 120); U = [(110, 50), (95, 180), (350, 52), (365, 190)]; Wn = [(30, 115), (440, 120)]
    for a, b in [(Wn[0], U[0]), (Wn[0], U[1]), (Wn[1], U[2]), (Wn[1], U[3]), (U[0], U[1])]:
        f.line(*a, *b, 'ln')
    for u in U:
        dx, dy = V[0] - u[0], V[1] - u[1]; L = math.hypot(dx, dy)
        f.line(u[0] + 18 * dx / L, u[1] + 18 * dy / L, V[0] - 24 * dx / L, V[1] - 24 * dy / L, 'lna thick', 'a')
    for u in U:
        f.circ(*u, 18, 'node n2', 'u', 'sm')
    for w in Wn:
        f.circ(*w, 15, 'node', '', 'sm')
    f.circ(*V, 22, 'node n3', 'v', 'b')
    f.text(230, 228, 'h_v ← UPDATE(h_v, AGG{ MSG(h_u) : u ∈ N(v) })', 'sm')
    f.text(230, 250, 'stack k layers → each node sees its k-hop neighbourhood', 'xs mut')
    f.done()


def iou_fig():
    f = F('iou_fig', 460, 240, 'Intersection over union')
    f.rect(30, 40, 170, 130, 'bacc', 4); f.rect(120, 90, 170, 130, 'b2', 4); f.rect(120, 90, 80, 80, 'inter', 0)
    f.text(40, 28, 'A: predicted box', 'sm acc', anchor='start'); f.text(290, 232, 'B: ground truth', 'sm tc2', anchor='end')
    f.text(160, 130, 'A ∩ B', 'sm b')
    f.text(380, 70, 'IoU =', 'b'); f.text(380, 104, 'area(A ∩ B)', 'sm'); f.line(320, 120, 440, 120, 'axis'); f.text(380, 136, 'area(A ∪ B)', 'sm')
    f.text(380, 176, '≥ 0.5 → match', 'xs mut')
    f.done()


def unet():
    f = F('unet', 460, 320, 'U-Net: encoder, decoder and skip connections')
    lv = [(20, '64'), (80, '128'), (140, '256'), (200, '512')]
    for y, t in lv:
        f.rect(40, y, 70, 40, 'bacc', 8, t, 'sm'); f.rect(350, y, 70, 40, 'b3', 8, t, 'sm')
        f.line(112, y + 20, 348, y + 20, 'lc2 dash', 'c2')
    for (y1, _), (y2, _) in zip(lv[:-1], lv[1:]):
        f.line(75, y1 + 40, 75, y2, 'ln', 'm'); f.line(385, y2, 385, y1 + 40, 'ln', 'm')
    f.rect(195, 252, 70, 40, 'b4', 8, '1024', 'sm')
    f.path('M75,240 L75,272 L193,272', 'ln', 'm'); f.path('M267,272 L385,272 L385,242', 'ln', 'm')
    f.text(230, 10, 'skip connections (copy + concatenate)', 'xs tc2')
    f.text(75, 308, 'encoder ↓ (pool)', 'xs mut'); f.text(385, 308, 'decoder ↑ (up-conv)', 'xs mut')
    f.done()


def vit_patches():
    f = F('vit_patches', 480, 360, 'Vision Transformer: patches become tokens')
    ops = rng.uniform(0.15, 0.85, 9)
    for k in range(9):
        i, j = divmod(k, 3)
        f.rect(180 + j * 40, 14 + i * 40, 38, 38, 'heat', 2, op=float(ops[k]))
    f.text(320, 74, 'image → 16×16 patches', 'xs mut', anchor='start')
    f.line(240, 136, 240, 176, 'ln', 'm')
    for k in range(10):
        x = 20 + k * 44
        f.rect(x, 182, 38, 32, 'b2' if k == 0 else 'bacc', 6, 'CLS' if k == 0 else f'P{k}', 'xs b' if k == 0 else 'xs')
        f.line(x + 19, 214, x + 19, 250, 'ln', 'm')
    f.text(240, 230, '', 'xs')
    f.rect(20, 252, 432, 40, 'b3', 10, 'Transformer encoder (L layers)')
    f.line(39, 292, 39, 314, 'ln', 'm')
    f.rect(20, 316, 220, 34, 'b4', 8, 'MLP head → class', 'sm')
    f.text(350, 333, 'each token = linear(patch) + pos', 'xs mut')
    f.done()


def clip_matrix():
    f = F('clip_matrix', 440, 420, 'CLIP: matching image–text pairs should have the highest similarity')
    ox, oy, c = 130, 110, 70
    f.text(270, 18, 'text encoder', 'sm b'); f.text(26, 250, 'image encoder', 'sm b', rot=-90)
    for k in range(4):
        f.rect(ox + k * c + 6, 40, c - 12, 50, 'b2', 8, f'T{"₁₂₃₄"[k]}', 'b')
        f.rect(52, oy + k * c + 6, 64, c - 12, 'bacc', 8, f'I{"₁₂₃₄"[k]}', 'b')
        for j in range(4):
            d = (k == j)
            f.rect(ox + j * c + 2, oy + k * c + 2, c - 4, c - 4, 'heat', 4, op=0.9 if d else 0.12)
            f.text(ox + j * c + c / 2, oy + k * c + c / 2, f'I{"₁₂₃₄"[k]}·T{"₁₂₃₄"[j]}', 'xs' + (' wht' if d else ''))
    f.text(270, 406, 'maximize the diagonal, push off-diagonal pairs apart', 'xs mut')
    f.done()


def skipgram():
    words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
    f = F('skipgram', 560, 170, 'Skip-gram: predict context words from the center word')
    c = 3
    for i, w in enumerate(words):
        x = 10 + i * 60
        cls = 'b2' if i == c else ('bacc' if abs(i - c) <= 2 else 'box')
        f.rect(x, 96, 56, 32, cls, 6, w, 'sm')
    cx = 10 + c * 60 + 28
    for i in [1, 2, 4, 5]:
        x = 10 + i * 60 + 28
        f.path(f'M{cx},94 Q{(cx + x) / 2},{40 if abs(i - c) == 2 else 58} {x},94', 'lna', 'a')
    f.text(cx, 150, 'center word', 'xs tc2'); f.text(cx, 22, 'context window = 2', 'xs acc')
    f.done()


def embed_space():
    f = P('embed_space', 460, 330, 'Word embeddings capture relationships as directions', (0, 10), (0, 8), pad=(20, 14, 14, 20))
    f.axes([], [])
    pts = {'man': (2, 1.6), 'woman': (2.6, 4.2), 'king': (6.2, 2.2), 'queen': (6.8, 4.8)}
    for a, b, cls, mk in [('man', 'woman', 'lc2', 'c2'), ('king', 'queen', 'lc2', 'c2'), ('man', 'king', 'lc3 dash', 'c3'), ('woman', 'queen', 'lc3 dash', 'c3')]:
        p, q = pts[a], pts[b]
        f.line(f.X(p[0]), f.Y(p[1]), f.X(q[0]) - 6 * (1 if q[0] > p[0] + 1 else 0), f.Y(q[1]) + (8 if q[1] > p[1] + 1 else 0), cls, mk)
    for k, (x, y) in pts.items():
        f.dots([x], [y], 'f1', 5); f.text(f.X(x) + 8, f.Y(y) + 12, k, 'sm b', anchor='start')
    for k, (x, y) in {'cat': (8.6, 7.2), 'dog': (9.3, 6.5), 'kitten': (8.0, 6.4), 'paris': (1.0, 7.2), 'rome': (1.9, 6.7), 'london': (0.9, 6.2)}.items():
        f.dots([x], [y], 'fm', 4); f.text(f.X(x) + 7, f.Y(y), k, 'xs mut', anchor='start')
    f.text(f.X(5), f.Y(0.5), 'king − man + woman ≈ queen', 'sm b')
    f.done()


def bert_gpt():
    f = F('bert_gpt', 540, 280, 'BERT sees both directions; GPT only sees the past')
    def row(y, toks, target, causal):
        xs = [30 + i * 82 for i in range(len(toks))]
        for i, t in enumerate(toks):
            f.rect(xs[i], y, 72, 34, 'b2' if i == target else 'bacc', 8, t, 'sm')
        tx = xs[target] + 36
        for i in range(len(toks)):
            if i == target or (causal and i > target):
                continue
            x = xs[i] + 36
            f.path(f'M{x},{y - 2} Q{(x + tx) / 2},{y - 30 - 6 * abs(i - target)} {tx},{y - 2}', 'ln', 'm')
    f.text(270, 16, 'BERT (encoder): bidirectional, predicts the masked token', 'sm b')
    row(90, ['The', '[MASK]', 'sat', 'on', 'the', 'mat'], 1, False)
    f.text(270, 152, 'GPT (decoder): causal, predicts the next token', 'sm b')
    row(236, ['The', 'cat', 'sat', 'on', 'the', '?'], 5, True)
    f.done()


def contrastive():
    f = F('contrastive', 480, 260, 'Contrastive learning pulls positive pairs together and pushes negatives apart')
    f.rect(16, 100, 60, 60, 'heat', 6, op=0.5); f.text(46, 178, 'image x', 'xs mut')
    for y, t in [(40, 'view 1'), (180, 'view 2')]:
        f.rect(110, y, 80, 40, 'b2', 8, t, 'sm'); f.line(78, 130, 108, y + 20, 'ln', 'm')
        f.rect(214, y, 84, 40, 'bacc', 8, 'encoder f', 'sm'); f.line(190, y + 20, 212, y + 20, 'ln', 'm')
    f.circ(395, 130, 78, 'pnlc')
    zi, zj = (380, 112), (408, 132)
    f.line(298, 60, zi[0] - 6, zi[1] - 4, 'ln thin', 'm'); f.line(298, 200, zj[0] - 4, zj[1] + 6, 'ln thin', 'm')
    for n in [(340, 178), (440, 82), (446, 176), (352, 76)]:
        f.line(zi[0], zi[1], n[0], n[1], 'lc5 dash'); f.circ(*n, 6, 'f5')
    f.line(zi[0], zi[1], zj[0], zj[1], 'lc3 thick')
    f.circ(*zi, 7, 'f1'); f.circ(*zj, 7, 'f1')
    f.text(395, 232, 'pull positives · push negatives', 'xs mut')
    f.done()


def distill():
    f = F('distill', 500, 250, 'Knowledge distillation from a teacher to a student')
    f.rect(20, 30, 140, 60, 'b4', 10, 'Teacher', 'b', 'large, frozen')
    f.rect(20, 160, 140, 60, 'bacc', 10, 'Student', 'b', 'small, trainable')
    f.text(90, 125, 'x', 'b'); f.line(90, 112, 90, 92, 'ln', 'm'); f.line(90, 138, 90, 158, 'ln', 'm')
    for (y, vals, cls) in [(30, [.5, .25, .12, .08, .05], 'b4'), (160, [.38, .3, .16, .1, .06], 'bacc')]:
        f.line(160, y + 30, 196, y + 30, 'ln', 'm')
        for k, v in enumerate(vals):
            h = v * 110
            f.rect(204 + k * 20, y + 60 - h, 16, h, cls, 2)
    f.text(250, 108, 'soft targets (temperature T)', 'xs mut')
    f.rect(370, 95, 120, 60, 'b5', 10, 'KL(p_T ‖ p_S)', 'sm', '+ CE(true labels)')
    f.line(310, 60, 368, 110, 'ln', 'm'); f.line(310, 190, 368, 140, 'ln', 'm')
    f.done()


def speech():
    f = F('speech', 520, 290, 'A waveform and its spectrogram')
    sr = 8000; t = np.arange(0, 1.0, 1 / sr)
    env = np.exp(-((t - 0.25) / 0.08) ** 2) + np.exp(-((t - 0.55) / 0.06) ** 2) + 0.8 * np.exp(-((t - 0.82) / 0.07) ** 2)
    sig = env * (np.sin(2 * np.pi * (300 + 900 * t) * t) + 0.5 * np.sin(2 * np.pi * 2.3 * (300 + 600 * t) * t)) + 0.03 * rng.normal(size=len(t))
    f.text(20, 14, 'waveform (amplitude over time)', 'xs mut', anchor='start')
    idx = np.linspace(0, len(t) - 1, 480).astype(int)
    pts = ' '.join(f'{20 + k:.1f},{70 - 40 * sig[i] / np.abs(sig).max():.1f}' for k, i in enumerate(idx))
    f.add(f'<polyline points="{pts}" class="s1 thinw"/>')
    nfft, hop = 256, 200; frames = []
    for s in range(0, len(sig) - nfft, hop):
        frames.append(np.abs(np.fft.rfft(sig[s:s + nfft] * np.hanning(nfft)))[:96])
    S = np.log1p(np.array(frames).T); S = S / S.max()
    nt, nf = 40, 20
    ti = np.linspace(0, S.shape[1] - 1, nt).astype(int); fi = np.linspace(0, S.shape[0] - 1, nf).astype(int)
    f.text(20, 130, 'spectrogram (frequency × time, brighter = more energy)', 'xs mut', anchor='start')
    for a, i in enumerate(fi):
        for b, j in enumerate(ti):
            v = S[i, j]
            if v > 0.3:
                f.add(f'<rect x="{20 + b * 12}" y="{280 - (a + 1) * 7}" width="12" height="7" class="heat" opacity="{min(1, (v - 0.25) * 1.6):.2f}"/>')
    f.rect(20, 140, 480, 140, 'frame', 0)
    f.done()


def ALL():
    for fn in [neuron, mlp, activations, act_derivs, compgraph, backprop_flow, dropout, norms, conv_op, maxpool,
               cnn_pipeline, resblock, rnn_unrolled, lstm_cell, attention, attn_heatmap, multihead, transformer_block,
               posenc, gnn, iou_fig, unet, vit_patches, clip_matrix, skipgram, embed_space, bert_gpt, contrastive,
               distill, speech]:
        fn()
