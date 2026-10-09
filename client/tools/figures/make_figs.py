"""Regenerate every SVG figure into content/figures/<name>.svg.

Usage:  python tools/figures/make_figs.py      (needs numpy)
Figures are referenced from lesson HTML as <!--FIG:name-->.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fig_lib, figs1, figs2, figs3, figs4, figs5  # noqa: E402

for mod in (figs1, figs2, figs3, figs4, figs5):
    mod.ALL()
out = os.path.join(HERE, '..', '..', 'content', 'figures')
os.makedirs(out, exist_ok=True)
for name, svg in fig_lib.FIGS.items():
    with open(os.path.join(out, name + '.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)
print(f'wrote {len(fig_lib.FIGS)} figures')
