@exercise cv-nms
lesson: detection-segmentation
title: IoU and non-maximum suppression
--- prompt
Boxes are `[x1, y1, x2, y2]`. Write `iou(a, b)` and `nms(boxes, scores, thr=0.5)`. NMS repeatedly keeps the highest-scoring remaining box and removes every other box whose IoU with it is at least `thr`. Return the indices of kept boxes, highest score first.
--- starter
def iou(a, b):
    raise NotImplementedError

def nms(boxes, scores, thr=0.5):
    raise NotImplementedError
--- solution
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    union = area(a) + area(b) - inter
    return inter / union if union > 0 else 0.0

def nms(boxes, scores, thr=0.5):
    order = sorted(range(len(boxes)), key=lambda i: scores[i], reverse=True)
    keep = []
    while order:
        i = order.pop(0)
        keep.append(i)
        order = [j for j in order if iou(boxes[i], boxes[j]) < thr]
    return keep
--- tests
import math
assert math.isclose(iou([0, 0, 10, 10], [5, 5, 15, 15]), 25 / 175), "IoU of the two offset squares is 25/175"
assert iou([0, 0, 1, 1], [2, 2, 3, 3]) == 0.0, "disjoint boxes have IoU 0"
assert iou([0, 0, 4, 4], [0, 0, 4, 4]) == 1.0, "identical boxes have IoU 1"
boxes = [[0, 0, 10, 10], [1, 1, 11, 11], [50, 50, 60, 60]]
assert nms(boxes, [0.9, 0.8, 0.7]) == [0, 2], "the second box overlaps the first heavily and should be suppressed"
assert nms(boxes, [0.6, 0.95, 0.7]) == [1, 2], "keep the highest-scoring box of each overlapping group"
