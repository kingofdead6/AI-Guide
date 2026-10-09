import { Link } from 'react-router-dom';
import { btn, useTitle } from '../components/ui';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <div className="mx-auto max-w-[700px] px-4 sm:px-6 pt-20 text-center">
      <div className="animate-float font-wide text-[120px] leading-none font-[800] text-gradient select-none" aria-hidden>
        404
      </div>
      <h1 className="animate-fade-up font-wide text-[40px] font-[780] tracking-tight">This page does not exist</h1>
      <p className="mt-3 text-muted text-lg">The link may be out of date. Every course is listed on the courses page.</p>
      <Link to="/courses" className={`${btn.primary} mt-8`}>
        See all courses
      </Link>
    </div>
  );
}
