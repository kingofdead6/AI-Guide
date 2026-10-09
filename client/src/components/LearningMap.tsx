import { useMemo } from 'react';
import { courses, getCourse } from '../lib/catalog';
import { courseStatus, programComplete } from '../lib/progress';
import { useProgress } from '../lib/store';
import { tone } from './ui';

type Pos = Record<string, [number, number]>;

/* The curriculum drawn as a small neural network: each course is a node, prerequisites are edges. */
const WIDE: { w: number; h: number; r: number; pos: Pos; labels: [string, number, number][] } = {
  w: 1000,
  h: 470,
  r: 21,
  pos: {
    python: [80, 110],
    math: [80, 235],
    data: [80, 360],
    ml: [255, 170],
    dl: [255, 320],
    cv: [440, 85],
    nlp: [440, 180],
    gen: [440, 285],
    rl: [440, 385],
    llm: [600, 140],
    rag: [600, 245],
    robotics: [600, 375],
    ops: [775, 120],
    security: [775, 245],
    systems: [775, 370],
    career: [925, 150],
    __cert: [925, 320],
  },
  labels: [
    ['Foundations', 80, 30],
    ['Core', 255, 30],
    ['Specializations', 520, 30],
    ['Production', 775, 30],
    ['Finish', 925, 30],
  ],
};
const TALL: typeof WIDE = {
  w: 360,
  h: 700,
  r: 18,
  pos: {
    python: [60, 70],
    math: [180, 70],
    data: [300, 70],
    ml: [120, 185],
    dl: [240, 185],
    cv: [45, 305],
    nlp: [135, 305],
    gen: [225, 305],
    rl: [315, 305],
    llm: [90, 410],
    rag: [180, 410],
    robotics: [290, 410],
    ops: [60, 525],
    security: [180, 525],
    systems: [300, 525],
    career: [120, 635],
    __cert: [240, 635],
  },
  labels: [],
};

function edgePath([x1, y1]: [number, number], [x2, y2]: [number, number], r: number, vertical: boolean) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dy) < 20) {
    // Same row: arc over whatever sits between the two nodes.
    const s = Math.sign(dx);
    return `M${x1 + s * r},${y1 - 4} Q${(x1 + x2) / 2},${y1 - 30 - 0.12 * Math.abs(dx)} ${x2 - s * r},${y2 - 4}`;
  }
  if (Math.abs(dx) < 40) {
    // Same column: bulge to the right so the edge skips nodes in between.
    return `M${x1 + r},${y1} C${x1 + r + 60},${y1} ${x2 + r + 60},${y2} ${x2 + r},${y2}`;
  }
  if (vertical) {
    const a = y1 + r;
    const b = y2 - r;
    const m = (a + b) / 2;
    return `M${x1},${a} C${x1},${m} ${x2},${m} ${x2},${b}`;
  }
  const a = x1 + r;
  const b = x2 - r;
  const m = (a + b) / 2;
  return `M${a},${y1} C${m},${y1} ${m},${y2} ${b},${y2}`;
}

function MapSvg({ layout, vertical, className }: { layout: typeof WIDE; vertical: boolean; className: string }) {
  const p = useProgress();
  const status = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, courseStatus(p, c)])), [p]);
  const certifiedCount = courses.filter((c) => status[c.id].certified).length;
  const done = programComplete(p);
  const { pos, r } = layout;
  const edges: { from: string; to: string }[] = [];
  for (const c of courses) for (const pre of c.prereqs) edges.push({ from: pre, to: c.id });
  for (const id of ['ops', 'security', 'systems', 'career']) edges.push({ from: id, to: '__cert' });

  return (
    <svg viewBox={`0 0 ${layout.w} ${layout.h}`} className={className} role="group" aria-label="Course map: each course with its prerequisites and your progress">
      {layout.labels.map(([t, x, y]) => (
        <text key={t} x={x} y={y} textAnchor="middle" className="fill-muted" style={{ font: '600 13px Archivo, sans-serif' }}>
          {t}
        </text>
      ))}
      <g fill="none" strokeWidth={1.6}>
        {edges.map(({ from, to }, i) => {
          const lit = status[from].certified;
          const color = to === '__cert' ? 'var(--warn)' : tone[getCourse(to)!.color].stroke;
          const d = edgePath(pos[from], pos[to], r + 3, vertical);
          const dashed = to === '__cert' && !lit;
          return dashed ? (
            <path key={i} d={d} stroke="var(--border-strong)" strokeDasharray="4 5" className="map-fade" style={{ ['--o' as string]: 0.75 }} />
          ) : (
            <path key={i} d={d} pathLength={1} stroke={lit ? color : 'var(--border-strong)'} opacity={lit ? 0.9 : 0.75} className="map-edge" style={{ ['--i' as string]: i }} />
          );
        })}
      </g>
      {/* Signals travelling along the network */}
      <g fill="none" strokeWidth={3} strokeLinecap="round" aria-hidden>
        {edges.map(({ from, to }, i) => {
          const color = to === '__cert' ? 'var(--warn)' : tone[getCourse(to)!.color].stroke;
          return <path key={i} d={edgePath(pos[from], pos[to], r + 3, vertical)} pathLength={1} stroke={color} className="map-pulse" style={{ ['--i' as string]: (i * 7) % edges.length }} />;
        })}
      </g>
      {courses.map((c, i) => {
        const [x, y] = pos[c.id];
        const s = status[c.id];
        const col = tone[c.color].stroke;
        const circ = 2 * Math.PI * (r - 2);
        return (
          <a key={c.id} href={`#/course/${c.id}`} className="group outline-none map-node" style={{ ['--i' as string]: i }} aria-label={`${c.title}: ${s.done} of ${s.total} lessons${s.certified ? ', certified' : ''}`}>
            <title>{`${c.title} · ${s.done}/${s.total} lessons`}</title>
            <circle cx={x} cy={y} r={r + 6} fill="transparent" className="group-focus-visible:stroke-[var(--accent)]" strokeWidth={2.5} />
            {s.started && !s.certified && <circle cx={x} cy={y} r={r} fill="none" stroke={col} strokeWidth={2} className="map-halo" style={{ animationDelay: `${(i % 5) * 0.45 + 1}s` }} />}
            <g className="node-core">
            <circle cx={x} cy={y} r={r} fill={s.certified ? col : s.started ? `color-mix(in srgb, ${col} 14%, var(--surface))` : 'var(--surface)'} stroke="var(--border-strong)" strokeWidth={1.2} />
            {!s.certified && s.pct > 0 && (
              <circle
                cx={x}
                cy={y}
                r={r - 2}
                fill="none"
                stroke={col}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - s.pct)}
                transform={`rotate(-90 ${x} ${y})`}
              />
            )}
            {s.certified ? (
              <path d={`M${x - 7},${y + 0.5} l4.6,4.6 l9.4,-9.4`} stroke="var(--surface)" strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fill={s.started ? col : 'var(--muted)'} style={{ font: `700 ${vertical ? 12 : 13}px Archivo, sans-serif` }}>
                {i + 1}
              </text>
            )}
            </g>
            <text
              x={x}
              y={y + r + (vertical ? 15 : 18)}
              textAnchor="middle"
              className="fill-ink group-hover:fill-[var(--accent)]"
              style={{ font: `600 ${vertical ? 11.5 : 13.5}px Archivo, sans-serif` }}
            >
              {c.short}
            </text>
          </a>
        );
      })}
      {(() => {
        const [x, y] = pos.__cert;
        const R = r + 6;
        const circ = 2 * Math.PI * (R - 2);
        return (
          <a href="#/certificate/program" className="map-node group" style={{ ['--i' as string]: courses.length }} aria-label={`Program certificate: ${certifiedCount} of ${courses.length} courses certified`}>
            <title>{`Program certificate · ${certifiedCount}/${courses.length} courses`}</title>
            <circle cx={x} cy={y} r={R} fill="none" stroke="var(--warn)" strokeWidth={2} className="map-halo" style={{ animationDelay: '1.4s', animationDuration: '3s' }} />
            <g className="node-core">
            <circle cx={x} cy={y} r={R} fill={done ? 'var(--warn)' : 'var(--warn-soft)'} stroke="var(--warn)" strokeWidth={1.4} />
            <circle
              cx={x}
              cy={y}
              r={R - 2}
              fill="none"
              stroke="var(--warn)"
              strokeWidth={4}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - certifiedCount / courses.length)}
              transform={`rotate(-90 ${x} ${y})`}
              strokeLinecap="round"
            />
            <path
              d={`M${x},${y - 9} l2.6,5.4 5.9,.8 -4.3,4.1 1,5.8 -5.2,-2.8 -5.2,2.8 1,-5.8 -4.3,-4.1 5.9,-.8z`}
              fill={done ? 'var(--surface)' : 'var(--warn)'}
            />
            </g>
            <text x={x} y={y + R + (vertical ? 15 : 18)} textAnchor="middle" className="fill-ink" style={{ font: `650 ${vertical ? 11.5 : 13.5}px Archivo, sans-serif` }}>
              Certificate
            </text>
          </a>
        );
      })()}
    </svg>
  );
}

export function LearningMap() {
  return (
    <>
      <MapSvg layout={WIDE} vertical={false} className="hidden md:block w-full h-auto" />
      <MapSvg layout={TALL} vertical className="md:hidden w-full h-auto max-w-[420px] mx-auto" />
    </>
  );
}
