@exercise rob-fk
lesson: robot-kinematics
title: Forward kinematics of a two-link arm
--- prompt
Write `fk(theta1, theta2, l1=1.0, l2=1.0)` returning the hand position `(x, y)` of a planar two-link arm (angles in radians):

$$x=l_1\cos\theta_1+l_2\cos(\theta_1+\theta_2),\quad y=l_1\sin\theta_1+l_2\sin(\theta_1+\theta_2)$$
--- starter
import math

def fk(theta1, theta2, l1=1.0, l2=1.0):
    raise NotImplementedError
--- solution
import math

def fk(theta1, theta2, l1=1.0, l2=1.0):
    x = l1 * math.cos(theta1) + l2 * math.cos(theta1 + theta2)
    y = l1 * math.sin(theta1) + l2 * math.sin(theta1 + theta2)
    return x, y
--- tests
import math
x, y = fk(0, 0)
assert math.isclose(x, 2) and abs(y) < 1e-12, "a straight arm along x reaches (2, 0)"
x, y = fk(0, math.pi / 2)
assert math.isclose(x, 1) and math.isclose(y, 1), "bending the elbow 90 degrees reaches (1, 1)"
x, y = fk(math.pi / 2, 0, 2.0, 0.5)
assert abs(x) < 1e-12 and math.isclose(y, 2.5), "pointing straight up with links 2 and 0.5"

@exercise rob-kalman
lesson: state-estimation
title: A one-dimensional Kalman filter
--- prompt
A robot's position follows \(x_t=x_{t-1}+u_t\) with process noise variance `q`, and a sensor measures position with noise variance `r`. Write `kalman_1d(x0, p0, controls, measurements, q, r)` that runs predict–update for each step and returns the list of `(x, p)` estimates after each update.
--- starter
def kalman_1d(x0, p0, controls, measurements, q, r):
    x, p = x0, p0
    out = []
    raise NotImplementedError
--- solution
def kalman_1d(x0, p0, controls, measurements, q, r):
    x, p = x0, p0
    out = []
    for u, z in zip(controls, measurements):
        x, p = x + u, p + q              # predict
        k = p / (p + r)                  # gain
        x, p = x + k * (z - x), (1 - k) * p
        out.append((x, p))
    return out
--- tests
import math
(x, p), = kalman_1d(0.0, 4.0, [0.0], [1.0], q=0.0, r=1.0)
assert math.isclose(x, 0.8) and math.isclose(p, 0.8), f"gain 0.8: expected (0.8, 0.8), got {(x, p)}"
est = kalman_1d(0.0, 1.0, [1.0] * 50, [float(t + 1) for t in range(50)], q=0.01, r=4.0)
assert abs(est[-1][0] - 50.0) < 0.5, "with consistent measurements the estimate should track the true position"
assert est[-1][1] < 1.0, "uncertainty should shrink below the prior"

@exercise rob-pid
lesson: robot-control
title: A PID controller with anti-windup
--- prompt
Write a class `PID(kp, ki, kd, u_min, u_max)` whose `step(error, dt)` returns a control clipped to `[u_min, u_max]`. Use \(u=K_pe+K_i\!\int e+K_d\,\dot e\) with the derivative computed from the previous error (0 on the first call). Only accumulate the integral when the unclipped output is inside the limits.
--- starter
class PID:
    def __init__(self, kp, ki, kd, u_min=-1.0, u_max=1.0):
        raise NotImplementedError

    def step(self, error, dt):
        raise NotImplementedError
--- solution
class PID:
    def __init__(self, kp, ki, kd, u_min=-1.0, u_max=1.0):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.u_min, self.u_max = u_min, u_max
        self.integral = 0.0
        self.prev = None

    def step(self, error, dt):
        d = 0.0 if self.prev is None else (error - self.prev) / dt
        self.prev = error
        u = self.kp * error + self.ki * (self.integral + error * dt) + self.kd * d
        if self.u_min < u < self.u_max:
            self.integral += error * dt
        return min(max(u, self.u_min), self.u_max)
--- tests
pid = PID(2.0, 0.0, 0.0, -10, 10)
assert pid.step(1.5, 0.1) == 3.0, "pure P control returns kp * error"
sat = PID(100.0, 1.0, 0.0, -1, 1)
for _ in range(100):
    u = sat.step(1.0, 0.1)
assert u == 1.0, "output must be clipped to u_max"
assert sat.integral == 0.0, "anti-windup: the integral must not grow while saturated"
x, v, ctrl = 0.0, 0.0, PID(6.0, 2.0, 2.2, -50, 50)
for _ in range(1500):
    u = ctrl.step(1.0 - x, 0.01)
    v += (u - 0.6 * v) * 0.01
    x += v * 0.01
assert abs(x - 1.0) < 0.02, f"the closed loop should settle near the target 1.0, got {x:.3f}"
