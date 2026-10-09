# The AI Guide Academy

A self-paced course site for becoming an AI engineer, from the math of machine learning to production systems. Built with React 19, TypeScript, Tailwind CSS v4 and Vite.

- **16 courses, 106 lessons**: Python, math, data, classical ML, deep learning, vision, NLP, LLMs, RAG and agents, generative models, RL, robotics, MLOps, AI security, systems, career.
- **458 graded quiz questions** of five types: single choice, multiple choice, true/false, numeric (with tolerance) and short text. Every answer shows right or wrong, the correct answer, and an explanation.
- **34 Python exercises** that run in the browser through Pyodide, graded by hidden tests.
- **A final exam per course** (20 questions, pass mark 70%) and **a certificate** you can download as PNG or print. Finish all 16 courses to unlock the program certificate.
- **Progress is saved automatically** in the browser (localStorage), with a JSON backup and restore on the My progress page.
- 90 diagrams, 8 interactive widgets, a glossary with flashcards, 6 guided projects, an equation cheat sheet, and Ctrl+K search.

## Getting started

Requires Node 20 or newer.

```bash
npm install
npm run dev        # builds the content, then starts Vite at http://localhost:5173
npm run build      # content + type-check + production build into dist/
npm run preview    # serve dist/ locally
```

`dist/` is fully static and uses hash routing with relative asset paths, so it can be hosted anywhere: GitHub Pages, Netlify, Vercel, S3, or opened from a subfolder.

## How it works

```
content/            source material (edit this)
  catalog.json        tracks, courses, lesson order, outcomes, prerequisites
  lessons/<course>/   one HTML file per lesson
  quizzes/*.quiz      quiz and exam questions per course
  exercises/*.ex      Python coding exercises per course
  figures/*.svg       diagrams, inserted with <!--FIG:name-->
  pages/              start, cheatsheet, resources
  glossary.json, projects.json
scripts/build-content.mjs   compiles content/ into src/generated/
src/
  lib/       catalog, grading, progress store (zustand + persist), types
  components/ UI pieces: quiz cards, code editor, certificate, learning map
  pages/     one file per route
  widgets/   interactive demos mounted inside lessons
  py/        Pyodide web worker and runner
tools/figures/            Python scripts that generate the SVG diagrams
tools/check_exercises.py  runs every exercise solution and starter
```

The content build pre-renders all math with KaTeX and all code with highlight.js, so lessons arrive as finished HTML and load instantly. It fails on broken LaTeX, unknown lesson links or missing figures; run `node scripts/build-content.mjs --lenient` to turn soft errors into warnings while drafting.

## Writing content

### Lessons

Plain HTML fragments in `content/lessons/<course>/<lesson-id>.html`. Add the lesson to `catalog.json` with an id, title and lead. Inside the HTML you can use:

| Syntax | Result |
| --- | --- |
| `\( ... \)` and `$$ ... $$` | inline and display math |
| `<pre><code class="language-python">` | highlighted code with a copy button |
| `<!--FIG:name-->` | inserts `content/figures/name.svg` |
| `<div class="widget" data-widget="nn"></div>` | an interactive widget (see `src/widgets/widgets.ts`) |
| `[[lesson-id]]` / `[[course:ml]]` | links to a lesson or course, titled automatically |
| `<h3>` | becomes an entry in the "On this page" outline |

### Quizzes (`content/quizzes/<course>.quiz`)

```
@lesson rl-foundations
Q: With rewards r1=r2=r3=1 and gamma=0.9, what is G0?
= 2.71 ±0.005
> 1 + 0.9 + 0.81 = 2.71.

Q: Which are optimizers?
* Adam
* SGD
- ReLU
> ReLU is an activation function.

@lesson exam
Q: Questions here only appear in the final exam.
...
```

- `*` marks a correct option, `-` a wrong one. One `*` gives a single-choice question, several give multiple choice.
- `= true` / `= false` gives a true/false question.
- `= <number>` gives a numeric question. Add `±tol` for a tolerance (integers default to exact, decimals to 1%). Answers like `3/4`, `75%` and `1,000` are accepted.
- `= text | alternative` gives a short-text question, compared case-insensitively.
- `>` is the explanation shown after checking.

Each lesson needs at least 3 questions and each course at least 3 exam-only questions. Exams draw 20 questions from the whole course and always include the exam-only ones.

### Code exercises (`content/exercises/<course>.ex`)

```
@exercise rl-returns
lesson: policy-gradient
title: Discounted returns
packages: numpy            # optional, loaded by Pyodide on demand
--- prompt
Markdown-ish text with math.
--- starter
def returns(rewards, gamma):
    raise NotImplementedError
--- solution
...
--- tests
assert returns([0, 0, 10], 0.5) == [2.5, 5.0, 10.0], "message shown on failure"
```

Check every exercise with `python3 tools/check_exercises.py`: each solution must pass its tests and each starter must fail them.

### Figures

`python3 tools/figures/make_figs.py` (needs numpy) regenerates every SVG in `content/figures/`. Figures use CSS classes from `src/styles/content.css`, so they follow light and dark mode.

## Progress, exams and certificates

| Rule | Value |
| --- | --- |
| Lesson complete | quiz score of 60% or more |
| Exam unlocks | every lesson in the course complete |
| Exam pass | 70% or more on 20 questions |
| Course certificate | all lessons complete and exam passed |
| Program certificate | all 16 course certificates |

Progress is stored under the localStorage key `aiguide-progress`. Signed-in learners also have it saved to their account through the API in `../server` (see the root README). Guests can use **My progress → Download backup** and **Restore from file** to move between devices.

Certificates carry a deterministic ID (`AIG-XXXX-XXXX`) derived from the name, course and completion date. They are self-issued completion records, not accredited qualifications.

## Python in the browser

Exercises run in a Web Worker that loads Pyodide 0.26.4 from `cdn.jsdelivr.net` on first use (about 10 MB, cached afterwards). Each run has a 15-second limit; if code hangs, the worker is restarted. To self-host Pyodide, copy `node_modules/pyodide` into `public/pyodide/` and change `PYODIDE_URL` in `src/py/pyodide.worker.js`.
