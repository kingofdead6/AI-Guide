import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { IconBook, IconCode, IconShield } from '../components/icons';
import { cx, useTitle } from '../components/ui';
import { SITE } from '../lib/site';

type Which = 'privacy' | 'terms' | 'cookies';
type Section = { id: string; title: string; body: ReactNode };

const A = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-accent font-medium hover:underline">
    {children}
  </Link>
);

const contact = SITE.contactEmail ? (
  <>
    {' '}
    You can also write to{' '}
    <a href={`mailto:${SITE.contactEmail}`} className="text-accent font-medium hover:underline">
      {SITE.contactEmail}
    </a>
    .
  </>
) : null;

const PAGES: Record<Which, { title: string; lead: string; icon: typeof IconShield; sections: Section[] }> = {
  privacy: {
    title: 'Privacy policy',
    lead: 'What we collect, why, and how you stay in control of it. In short: only what is needed to save your progress, nothing sold, no tracking.',
    icon: IconShield,
    sections: [
      {
        id: 'collect',
        title: 'What we collect',
        body: (
          <>
            <p>You can use the whole academy without an account. In that case nothing about you reaches our server; your progress stays in your browser.</p>
            <p>If you create an account, we store:</p>
            <ul>
              <li>
                <strong>Account details:</strong> your name, your email address and your password. The password is stored only as a one-way bcrypt hash; nobody, including administrators, can read it.
              </li>
              <li>
                <strong>Learning progress:</strong> lessons opened and completed, quiz answers and scores, exam attempts, code you write in exercises, project milestones, certificates, daily activity counts and your theme preference.
              </li>
              <li>
                <strong>Timestamps:</strong> when you joined, when you were last active and when your progress was last saved.
              </li>
              <li>
                <strong>Deletion requests:</strong> if you ask us to delete your account, the date and any reason you choose to give.
              </li>
            </ul>
            <p>We do not collect payment details, location, contacts, or any analytics or advertising identifiers.</p>
          </>
        ),
      },
      {
        id: 'use',
        title: 'How we use it',
        body: (
          <ul>
            <li>To save your progress and restore it when you sign in on any device.</li>
            <li>To sign you in and keep your account secure.</li>
            <li>To let administrators see how learners are progressing through the courses, so the academy can be improved, and to handle deletion requests.</li>
          </ul>
        ),
      },
      {
        id: 'access',
        title: 'Who can see it',
        body: (
          <>
            <p>
              Academy administrators can see each account&apos;s name, email, dates and learning progress. They cannot see your password. We do not sell, rent or share your data with anyone for marketing.
            </p>
            <p>The data is stored in a MongoDB database run by our hosting provider, who processes it only to provide that service.</p>
          </>
        ),
      },
      {
        id: 'third-parties',
        title: 'Third-party services',
        body: (
          <>
            <p>Some files are loaded from other services. They receive your IP address and browser details, as any website you visit does:</p>
            <ul>
              <li>
                <strong>Google Fonts</strong> serves the typefaces used on the site.
              </li>
              <li>
                <strong>jsDelivr</strong> serves Pyodide, the in-browser Python used by code exercises. It loads only when you run code.
              </li>
            </ul>
            <p>Your Python code runs entirely inside your browser and is not sent anywhere except to your account when you are signed in.</p>
          </>
        ),
      },
      {
        id: 'retention',
        title: 'How long we keep it',
        body: <p>We keep your account and progress for as long as the account exists. When an account is deleted, its data is removed from our database permanently.</p>,
      },
      {
        id: 'rights',
        title: 'Your choices and rights',
        body: (
          <>
            <ul>
              <li>
                <strong>See and export</strong> everything we hold about your learning on <A to="/progress">My progress</A>, using Download backup.
              </li>
              <li>
                <strong>Correct</strong> your name in <A to="/account">Account settings</A>.
              </li>
              <li>
                <strong>Erase</strong> your progress at any time from My progress, or ask for the whole account to be deleted from Account settings. An administrator reviews the request and deletes the account.
              </li>
            </ul>
            <p>Questions about your data can be raised from your account.{contact}</p>
          </>
        ),
      },
      {
        id: 'security',
        title: 'Security',
        body: (
          <p>
            Passwords are hashed with bcrypt, sign-in tokens expire, and changing your password signs out every other device. No system is perfectly secure, so use a password you do not use elsewhere.
          </p>
        ),
      },
      {
        id: 'children',
        title: 'Children',
        body: <p>The academy is intended for learners aged 13 and over. If you are under the age required by your country to consent to data processing, ask a parent or guardian before creating an account.</p>,
      },
      {
        id: 'changes',
        title: 'Changes to this policy',
        body: <p>If we change how we handle your data, we will update this page and the date at the top.</p>,
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    lead: 'The ground rules for using the academy. Please read them before creating an account.',
    icon: IconBook,
    sections: [
      {
        id: 'service',
        title: 'The service',
        body: <p>{SITE.name} is a free, self-paced learning site. Courses, quizzes, exercises and certificates are provided as they are, and may change or be removed at any time.</p>,
      },
      {
        id: 'accounts',
        title: 'Your account',
        body: (
          <ul>
            <li>Give a real name and an email address you control. Keep your password private; you are responsible for activity on your account.</li>
            <li>One account per person.</li>
            <li>You can stop using the academy at any time and ask for your account to be deleted from Account settings.</li>
          </ul>
        ),
      },
      {
        id: 'conduct',
        title: 'Acceptable use',
        body: (
          <>
            <p>Do not:</p>
            <ul>
              <li>try to access other people&apos;s accounts or data, or parts of the service you are not meant to reach;</li>
              <li>overload, probe or disrupt the service, or automate sign-ups or requests;</li>
              <li>use the code runner or any other feature to break the law or harm others.</li>
            </ul>
            <p>Administrators may suspend or delete accounts that break these rules.</p>
          </>
        ),
      },
      {
        id: 'certificates',
        title: 'Certificates',
        body: (
          <p>
            Certificates record that you completed a course&apos;s lessons and passed its final exam in this academy. They are self-issued completion records, not accredited qualifications, and should not be presented as anything more.
          </p>
        ),
      },
      {
        id: 'content',
        title: 'Course material',
        body: <p>You may use the course material for your own learning. Do not republish substantial parts of it without permission. Links to outside books, papers and courses belong to their respective owners.</p>,
      },
      {
        id: 'warranty',
        title: 'No warranty',
        body: (
          <p>
            We work hard to make the material accurate, but it is educational content provided without warranty. It is not professional advice. To the extent the law allows, we are not liable for losses arising from your use of the academy.
          </p>
        ),
      },
      {
        id: 'privacy',
        title: 'Privacy',
        body: (
          <p>
            How we handle your data is described in the <A to="/privacy">privacy policy</A> and <A to="/cookies">cookies and storage notice</A>.
          </p>
        ),
      },
      {
        id: 'changes',
        title: 'Changes',
        body: <p>We may update these terms. Continuing to use the academy after a change means you accept the new terms.</p>,
      },
    ],
  },
  cookies: {
    title: 'Cookies and storage',
    lead: 'We use no cookies at all: no tracking, no advertising, no analytics. The site does keep a few things in your browser so it works, listed below.',
    icon: IconCode,
    sections: [
      {
        id: 'storage',
        title: 'What is stored in your browser',
        body: (
          <>
            <p>These live in your browser&apos;s local storage, never in cookies:</p>
            <div className="not-prose overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-[14.5px]">
                <thead className="bg-sunk/70 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Key</th>
                    <th className="px-4 py-2.5 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ['aiguide-progress', 'Your lessons, quiz answers, exams, code, certificates and theme. Lets the site work without an account.'],
                    ['aiguide-token', 'Keeps you signed in. Only present while you are signed in.'],
                    ['aiguide-user', 'Your name, email and role, so the page can show them before the server answers.'],
                    ['aiguide-sync', 'Notes whether there are changes not yet saved to your account.'],
                    ['aiguide-appearance', 'Your colour theme, fonts, reading size and motion choices from Settings.'],
                    ['aiguide-appearance-boot', 'A ready-made copy of those choices, applied before the page draws so it never flashes the default look.'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="px-4 py-2.5 font-mono text-[13px] whitespace-nowrap align-top">{k}</td>
                      <td className="px-4 py-2.5 text-muted">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Your browser may also cache the Python runtime and fonts so they load faster next time.</p>
          </>
        ),
      },
      {
        id: 'third',
        title: 'Third parties',
        body: (
          <p>
            Fonts come from Google Fonts and the Python runtime from jsDelivr. Neither is used by us for tracking. See the <A to="/privacy">privacy policy</A> for details.
          </p>
        ),
      },
      {
        id: 'control',
        title: 'Clearing it',
        body: (
          <p>
            Signing out removes your sign-in and progress from the browser. Clearing this site&apos;s data in your browser settings removes everything; if you do not have an account, back up your progress first from <A to="/progress">My progress</A>.
          </p>
        ),
      },
    ],
  },
};

const TABS: { id: Which; label: string }[] = [
  { id: 'privacy', label: 'Privacy policy' },
  { id: 'terms', label: 'Terms of use' },
  { id: 'cookies', label: 'Cookies and storage' },
];

export default function PolicyPage({ which }: { which: Which }) {
  const page = PAGES[which];
  useTitle(page.title);
  const Icon = page.icon;

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <header className="pt-8 sm:pt-12 pb-8">
        <span className="animate-spin-in inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={24} />
        </span>
        <h1 className="animate-fade-up mt-4 font-wide text-[34px] sm:text-[46px] leading-[1.05] font-[750] tracking-[-0.02em]">{page.title}</h1>
        <p className="animate-fade-up mt-3 text-muted text-lg max-w-2xl" style={{ ['--d' as string]: 1 }}>
          {page.lead}
        </p>
        <p className="animate-fade-up mt-3 text-[13.5px] text-muted" style={{ ['--d' as string]: 2 }}>
          Last updated {SITE.policiesUpdated}
        </p>
      </header>

      <div className="grid lg:grid-cols-[230px_minmax(0,1fr)] gap-10">
        <aside className="lg:sticky lg:top-24 self-start">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0" aria-label="Policies">
            {TABS.map((t) => (
              <NavLink
                key={t.id}
                to={`/${t.id}`}
                className={({ isActive }) =>
                  cx('whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors', isActive ? 'bg-accent-soft text-accent-ink font-semibold' : 'text-muted hover:bg-sunk hover:text-ink')
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:block mt-6 border-t border-line pt-5">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted mb-2">On this page</p>
            <ol className="flex flex-col gap-1.5 text-[14px]">
              {page.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-muted hover:text-accent transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0 flex flex-col gap-4">
          {page.sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              data-reveal
              style={{ ['--d' as string]: Math.min(i, 3) }}
              className="scroll-mt-24 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] text-[16px] leading-relaxed [&_p]:mt-3 [&_p:first-child]:mt-0 [&_ul]:mt-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:marker:text-accent [&_strong]:font-semibold [&_.not-prose]:mt-3"
            >
              <h2 className="text-[20px] font-bold mb-3 flex items-baseline gap-3">
                <span className="text-[13px] font-bold text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
