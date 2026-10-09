"""Figures for the Python course and projects."""
import numpy as np
from fig_lib import F


def py_names():
    f = F('py_names', 480, 264, 'Names point to objects: two names can share one mutable list')
    f.text(110, 18, 'names', 'sm b'); f.text(360, 18, 'objects in memory', 'sm b')
    f.rect(60, 50, 100, 40, 'b2', 8, 'a', 'b'); f.rect(60, 120, 100, 40, 'b2', 8, 'b', 'b'); f.rect(60, 190, 100, 40, 'b2', 8, 'c', 'b')
    f.rect(280, 70, 170, 56, 'bacc', 10, '[1, 2, 3, 4]', 'sm', 'list (mutable)')
    f.rect(280, 180, 170, 56, 'b3', 10, '[1, 2, 3]', 'sm', 'a separate copy')
    f.line(160, 70, 278, 92, 'lna', 'a'); f.line(160, 140, 278, 104, 'lna', 'a'); f.line(160, 210, 278, 208, 'lc3', 'c3')
    f.text(240, 254, 'b = a shares the list · c = a.copy() makes a new one', 'xs mut')
    f.done()


def py_broadcast():
    f = F('py_broadcast', 520, 220, 'Broadcasting: shapes (3, 1) and (1, 4) stretch to (3, 4)')
    c = 30
    for i in range(3):
        f.rect(20, 50 + i * c, c, c, 'b2', 0, str(i * 10), 'sm')
        for j in range(1, 4):
            f.rect(20 + j * c, 50 + i * c, c, c, 'b2', 0, str(i * 10), 'xs mut', op=0.35)
    f.text(80, 28, 'A: (3, 1)', 'sm b')
    f.text(160, 95, '+', 'lg')
    for j in range(4):
        f.rect(180 + j * c, 50, c, c, 'bacc', 0, str(j), 'sm')
        for i in range(1, 3):
            f.rect(180 + j * c, 50 + i * c, c, c, 'bacc', 0, str(j), 'xs mut', op=0.35)
    f.text(240, 28, 'B: (1, 4)', 'sm b')
    f.text(320, 95, '=', 'lg')
    for i in range(3):
        for j in range(4):
            f.rect(340 + j * c, 50 + i * c, c, c, 'b3', 0, str(i * 10 + j), 'sm')
    f.text(400, 28, 'A + B: (3, 4)', 'sm b')
    f.text(260, 172, 'faded cells are virtual copies: no memory is actually duplicated', 'xs mut')
    f.text(260, 194, 'rule: compare shapes from the right; sizes must match or be 1', 'xs mut')
    f.done()


def project_flow():
    f = F('project_flow', 520, 120, 'The shape of every guided project')
    steps = [('Frame', 'b2'), ('Data', 'bacc'), ('Baseline', 'bacc'), ('Improve', 'bacc'), ('Evaluate', 'b4'), ('Ship', 'b3')]
    for i, (t, c) in enumerate(steps):
        x = 6 + i * 86
        f.rect(x, 36, 78, 44, c, 10, t, 'xs b')
        if i < 5:
            f.line(x + 78, 58, x + 86, 58, 'ln', 'm')
    f.path('M430,82 C430,108 90,108 90,84', 'lc5 dash', 'c5'); f.text(260, 112, 'iterate: most gains come from data and evaluation', 'xs tc5')
    f.done()


def ALL():
    py_names(); py_broadcast(); project_flow()
