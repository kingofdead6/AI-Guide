import { dayKey } from '../lib/store';

export function Heatmap({ activity, caption = true }: { activity: Record<string, number>; caption?: boolean }) {
  const weeks = 20;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  // Columns are weeks (Monday to Sunday); the last column contains today.
  const end = today.getTime();
  const firstMonday = new Date(end - (weeks - 1) * 7 * 86400000);
  firstMonday.setDate(firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7));
  const cells: { k: string; v: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const t = firstMonday.getTime() + (w * 7 + d) * 86400000;
      const k = dayKey(t);
      col.push({ k, v: activity[k] || 0, future: t > end });
    }
    cells.push(col);
  }
  const max = Math.max(4, ...Object.values(activity));
  const total = Object.values(activity).reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label={`Activity over the last ${weeks} weeks: ${total} actions`}>
        {cells.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((c) => (
              <div
                key={c.k}
                title={`${c.k}: ${c.v} actions`}
                className="h-3.5 w-3.5 rounded-[3px] transition-transform duration-200 hover:scale-150 hover:relative hover:z-10"
                style={{
                  background: c.future ? 'transparent' : c.v ? `color-mix(in srgb, var(--ok) ${25 + (75 * Math.min(c.v, max)) / max}%, var(--surface))` : 'var(--sunk)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {caption && <p className="mt-2 text-[13px] text-muted">Each square is a day. Checking answers, finishing lessons, passing exams and solving exercises all count.</p>}
    </div>
  );
}
