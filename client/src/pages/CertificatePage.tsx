import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Certificate, downloadPng } from '../components/Certificate';
import { fireConfetti } from '../components/motion';
import { IconAward, IconCheck, IconDownload, IconLock, IconPrint } from '../components/icons';
import { btn, cx, ProgressBar, tone, useTitle } from '../components/ui';
import { courses, getCourse } from '../lib/catalog';
import { certificateId, courseStatus, pct, programComplete } from '../lib/progress';
import { useProgress } from '../lib/store';
import NotFound from './NotFound';

const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function CertificatePage() {
  const { courseId } = useParams();
  const isProgram = courseId === 'program';
  const course = isProgram ? undefined : getCourse(courseId);
  const p = useProgress();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nameDraft, setNameDraft] = useState(p.name);
  const [err, setErr] = useState('');
  useTitle(isProgram ? 'Program certificate' : course ? `${course.title} certificate` : 'Certificate');

  const eligible = isProgram ? programComplete(p) : course ? courseStatus(p, course).certified : false;
  const key = isProgram ? 'program' : course?.id ?? '';
  const cert = p.certificates[key];

  useEffect(() => {
    if (eligible && key && !cert) useProgress.getState().issueCertificate(key);
  }, [eligible, key, cert]);
  useEffect(() => {
    if (eligible) fireConfetti({ count: 180, origin: { x: 0.5, y: 0.25 } });
  }, [eligible]);

  if (!isProgram && !course) return <NotFound />;

  const title = isProgram ? 'AI Engineer Track' : course!.title;

  if (!eligible) {
    return (
      <div className="mx-auto max-w-[820px] px-4 sm:px-6 pt-10">
        <h1 className="font-wide text-[34px] sm:text-[46px] font-[780] tracking-[-0.03em] leading-[1.05]">{title} certificate</h1>
        <p className="mt-3 text-lg text-muted flex items-center gap-2">
          <IconLock size={18} /> Not earned yet
        </p>
        {isProgram ? (
          <>
            <p className="mt-6 text-[17px]">The program certificate is awarded when you hold a certificate for every course. Here is where you stand:</p>
            <ul className="mt-5 border-y border-line divide-y divide-line">
              {courses.map((c) => {
                const s = courseStatus(p, c);
                return (
                  <li key={c.id}>
                    <Link to={s.certified ? `/certificate/${c.id}` : `/course/${c.id}`} className="grid grid-cols-[24px_1fr_120px] gap-3 items-center py-3 group">
                      {s.certified ? <IconCheck className="text-ok" strokeWidth={3} /> : <span className="h-4 w-4 rounded-full border-2 border-line-strong ml-1" />}
                      <span className="font-medium group-hover:text-accent">{c.title}</span>
                      <ProgressBar value={s.certified ? 1 : s.pct * 0.9} color={tone[c.color].stroke} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          (() => {
            const s = courseStatus(p, course!);
            return (
              <div className="mt-6 rounded-2xl border border-line bg-surface p-6 flex flex-col gap-4">
                <Req done={s.lessonsComplete} text={`Complete all ${s.total} lessons (${s.done} done)`} />
                <ProgressBar value={s.pct} color={tone[course!.color].stroke} />
                <Req done={s.examPassed} text={`Pass the final exam with 70% or more${s.examBest ? ` (best so far ${pct(s.examBest)})` : ''}`} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to={`/course/${course!.id}`} className={btn.primary}>
                    Go to the course
                  </Link>
                  {s.lessonsComplete && (
                    <Link to={`/course/${course!.id}/exam`} className={btn.secondary}>
                      Take the exam
                    </Link>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  }

  const issuedAt = cert?.issuedAt ?? Date.now();
  const name = p.name.trim();
  const id = certificateId(key, issuedAt, name);
  const details = isProgram
    ? `${courses.reduce((n, c) => n + c.lessons.length, 0)} lessons and ${courses.length} final exams passed`
    : `${course!.lessons.length} lessons and ${course!.questions} quiz questions completed, final exam score ${pct(p.exams[course!.id]?.best ?? 0)}`;

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-8 print-area">
      <div className="no-print">
        <p className="text-ok font-semibold flex items-center gap-2">
          <IconAward size={18} /> Certificate earned on {fmtDate(issuedAt)}
        </p>
        <h1 className="animate-fade-up mt-2 font-wide text-[34px] sm:text-[46px] font-[780] tracking-[-0.03em] leading-[1.05]">Congratulations{name ? `, ${name.split(' ')[0]}` : ''}.</h1>
        <p className="mt-2 text-lg text-muted max-w-2xl">
          {isProgram ? 'You finished every course in the academy.' : `You finished ${course!.title}.`} Add your name as you want it to appear, then download or print your certificate.
        </p>
        <form
          className="mt-6 flex flex-wrap gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            useProgress.getState().setName(nameDraft.trim());
          }}
        >
          <label className="flex flex-col gap-1 text-[14px] font-semibold">
            Name on certificate
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={60}
              placeholder="Your full name"
              className="w-72 max-w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[16px] font-normal outline-none focus:border-accent"
            />
          </label>
          <button type="submit" className={btn.secondary} disabled={nameDraft.trim() === name}>
            Save name
          </button>
        </form>
      </div>

      <div className="animate-fade-up mt-8 rounded-xl border border-line overflow-hidden shadow-[var(--shadow-lift)] bg-white" style={{ ['--d' as string]: 2 }}>
        <Certificate ref={svgRef} name={name} title={title} kind={isProgram ? 'program' : 'course'} details={details} date={fmtDate(issuedAt)} certId={id} courseList={isProgram ? courses.map((c) => c.title) : undefined} />
      </div>

      <div className="no-print mt-5 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className={btn.primary}
          disabled={!name}
          onClick={async () => {
            setErr('');
            try {
              await downloadPng(svgRef.current!, `certificate-${key}.png`);
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          <IconDownload size={18} /> Download image
        </button>
        <button type="button" className={btn.secondary} disabled={!name} onClick={() => window.print()}>
          <IconPrint size={18} /> Print or save as PDF
        </button>
        {!name && <span className="text-[14px] text-warn">Add your name first.</span>}
        {err && <span className="text-[14px] text-bad">{err}</span>}
      </div>
      <p className={cx('no-print mt-3 text-[13.5px] text-muted max-w-2xl')}>
        Certificate ID {id}. It is generated from your name, the course and the completion date, and recorded with your progress in this browser.
      </p>
    </div>
  );
}

function Req({ done, text }: { done: boolean; text: string }) {
  return (
    <p className="flex items-center gap-2.5 text-[16px]">
      {done ? <IconCheck className="text-ok" strokeWidth={3} /> : <span className="h-4 w-4 rounded-full border-2 border-line-strong mx-0.5" />}
      <span className={done ? '' : 'text-ink'}>{text}</span>
    </p>
  );
}
