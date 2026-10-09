import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, useTitle } from '../components/ui';
import { courses } from '../lib/catalog';
import { mountWidget } from '../widgets/widgets';

const TOOLS: { id: string; intro: string }[] = [
  { id: 'nn', intro: 'Train a small neural network in your browser and watch the decision boundary bend. Change the data set, depth, width and activation.' },
  { id: 'neuron', intro: 'Drag the weights and bias of a single neuron to see what one unit can and cannot represent.' },
  { id: 'opt', intro: 'Race gradient descent, momentum and Adam across an ill-conditioned bowl and the Rosenbrock valley.' },
  { id: 'poly', intro: 'Fit polynomials of increasing degree and watch training and test error split apart, then tame them with ridge regularization.' },
  { id: 'kmeans', intro: 'Step through k-means one assignment and one update at a time.' },
  { id: 'conv', intro: 'Slide a 3×3 kernel over an image and see exactly how each output value is computed.' },
  { id: 'attn', intro: 'Pick a query word and see where it attends, with and without a causal mask.' },
  { id: 'sampling', intro: 'Change temperature, top-k and top-p and sample the next word yourself.' },
];

function Tool({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => mountWidget(ref.current!, id), [id]);
  return <div ref={ref} className="widget" />;
}

export default function PlaygroundPage() {
  useTitle('Playground');
  const home = (id: string) => {
    for (const c of courses) for (const l of c.lessons) if (l.widgets.includes(id)) return { c, l };
    return null;
  };
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6">
      <PageHeader title="Playground" sub="Every interactive demo from the courses in one place. Change one setting at a time and predict what will happen before you look." />
      <div className="flex flex-col gap-12">
        {TOOLS.map((t) => {
          const h = home(t.id);
          return (
            <section key={t.id} className="prose-lesson">
              <p className="!max-w-none">
                {t.intro}{' '}
                {h && (
                  <>
                    From{' '}
                    <Link className="xref" to={`/course/${h.c.id}/${h.l.id}`}>
                      {h.l.title}
                    </Link>
                    .
                  </>
                )}
              </p>
              <Tool id={t.id} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
