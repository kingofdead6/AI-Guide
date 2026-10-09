import { forwardRef } from 'react';

export type CertificateProps = {
  name: string;
  title: string;
  kind: 'course' | 'program';
  details: string;
  date: string;
  certId: string;
  courseList?: string[];
};

const INK = '#14141f';
const MUTED = '#5c5f72';
const ACCENT = '#5145e5';
const AMBER = '#e07612';
const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const SANS = "Archivo, 'Helvetica Neue', Arial, sans-serif";

/** A fixed-colour certificate (it prints and exports the same in light and dark mode). */
export const Certificate = forwardRef<SVGSVGElement, CertificateProps>(function Certificate({ name, title, kind, details, date, certId, courseList }, ref) {
  const W = 1400;
  const H = 990;
  // Background motif: a faint three-layer network in the corner.
  const layers = [
    [0, 1, 2, 3].map((i) => [1080, 470 + i * 62]),
    [0, 1, 2, 3, 4].map((i) => [1180, 439 + i * 62]),
    [0, 1].map((i) => [1280, 532 + i * 80]),
  ];
  const edges: string[] = [];
  for (let l = 0; l < layers.length - 1; l++)
    for (const a of layers[l]) for (const b of layers[l + 1]) edges.push(`M${a[0]},${a[1]} L${b[0]},${b[1]}`);
  const nameSize = name.length > 34 ? 50 : name.length > 24 ? 60 : 70;
  const titleSize = title.length > 30 ? 36 : 44;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Certificate of completion for ${name}: ${title}`}>
      <rect width={W} height={H} fill="#ffffff" />
      <rect x={26} y={26} width={W - 52} height={H - 52} fill="none" stroke={INK} strokeWidth={2.5} />
      <rect x={40} y={40} width={W - 80} height={H - 80} fill="none" stroke={ACCENT} strokeWidth={1.2} />
      <g opacity={0.09} stroke={ACCENT} strokeWidth={1.4} fill="none">
        {edges.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {layers.flat().map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={11} fill="#fff" strokeWidth={2.5} />
        ))}
      </g>

      {/* brand */}
      <g transform="translate(96 96)">
        <rect width={44} height={44} rx={11} fill={ACCENT} />
        <circle cx={14} cy={15} r={4} fill="#fff" />
        <circle cx={14} cy={29} r={4} fill="#fff" />
        <circle cx={31} cy={22} r={5} fill="#f5a84a" />
        <path d="M17.6 16.6 26.4 20.6M17.6 27.4 26.4 23.4" stroke="#fff" strokeWidth={2} />
        <text x={60} y={20} fill={INK} style={{ font: `700 20px ${SANS}` }}>
          The AI Guide Academy
        </text>
        <text x={60} y={41} fill={MUTED} style={{ font: `400 15px ${SANS}` }}>
          From vectors to agents
        </text>
      </g>
      <text x={W - 96} y={116} textAnchor="end" fill={MUTED} style={{ font: `500 15px ${SANS}` }}>
        Certificate ID
      </text>
      <text x={W - 96} y={140} textAnchor="end" fill={INK} style={{ font: `600 17px 'JetBrains Mono', Menlo, monospace` }}>
        {certId}
      </text>

      <text x={W / 2} y={262} textAnchor="middle" fill={INK} style={{ font: `700 ${kind === 'program' ? 52 : 56}px ${SANS}`, letterSpacing: '-0.5px' }}>
        {kind === 'program' ? 'Program certificate' : 'Certificate of completion'}
      </text>
      <text x={W / 2} y={318} textAnchor="middle" fill={MUTED} style={{ font: `italic 400 24px ${SERIF}` }}>
        This certifies that
      </text>
      <text x={W / 2} y={408} textAnchor="middle" fill={INK} style={{ font: `600 ${nameSize}px ${SERIF}` }}>
        {name || 'Your name'}
      </text>
      <line x1={W / 2 - 330} x2={W / 2 + 330} y1={438} y2={438} stroke={AMBER} strokeWidth={2} />
      <text x={W / 2} y={488} textAnchor="middle" fill={MUTED} style={{ font: `italic 400 24px ${SERIF}` }}>
        {kind === 'program' ? 'has completed every course of the' : 'has successfully completed the course'}
      </text>
      <text x={W / 2} y={552} textAnchor="middle" fill={ACCENT} style={{ font: `700 ${titleSize}px ${SANS}` }}>
        {title}
      </text>
      <text x={W / 2} y={606} textAnchor="middle" fill={INK} style={{ font: `400 21px ${SERIF}` }}>
        {details}
      </text>

      {kind === 'program' && courseList && (
        <g style={{ font: `500 15px ${SANS}` }} fill={MUTED}>
          {courseList.map((c, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <text key={c} x={W / 2 - 450 + col * 300} y={660 + row * 28} textAnchor="middle">
                {c}
              </text>
            );
          })}
        </g>
      )}

      {/* footer */}
      <g transform={`translate(150 ${H - 170})`}>
        <text x={0} y={0} fill={INK} style={{ font: `600 22px ${SERIF}` }}>
          {date}
        </text>
        <line x1={0} x2={300} y1={16} y2={16} stroke={INK} strokeWidth={1.2} />
        <text x={0} y={42} fill={MUTED} style={{ font: `500 15px ${SANS}` }}>
          Date of completion
        </text>
      </g>
      <g transform={`translate(${W / 2} ${H - 175})`}>
        <circle r={62} fill="none" stroke={AMBER} strokeWidth={2.5} />
        <circle r={52} fill="none" stroke={AMBER} strokeWidth={1} strokeDasharray="3 4" />
        <path d="M0,-24 l7,14.5 16,2.3 -11.6,11.2 2.7,15.9 -14.1,-7.5 -14.1,7.5 2.7,-15.9 -11.6,-11.2 16,-2.3z" fill={AMBER} />
      </g>
      <g transform={`translate(${W - 450} ${H - 170})`}>
        <text x={0} y={0} fill={INK} style={{ font: `italic 600 24px ${SERIF}` }}>
          The AI Guide Academy
        </text>
        <line x1={0} x2={300} y1={16} y2={16} stroke={INK} strokeWidth={1.2} />
        <text x={0} y={42} fill={MUTED} style={{ font: `500 15px ${SANS}` }}>
          Issuer
        </text>
      </g>
      <text x={W / 2} y={H - 64} textAnchor="middle" fill={MUTED} style={{ font: `400 13px ${SANS}` }}>
        Self-paced completion record: every lesson quiz passed and the final exam passed with 70% or more. Not an academic degree or accredited qualification.
      </text>
    </svg>
  );
});

/** Rasterize the certificate SVG to a PNG and download it. Web fonts fall back to system fonts in the image. */
export async function downloadPng(svg: SVGSVGElement, filename: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Could not render the certificate image.'));
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 2800;
  canvas.height = 1980;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not create the PNG.');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
