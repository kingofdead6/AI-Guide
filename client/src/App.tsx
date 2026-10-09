import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { useAuth } from './lib/auth';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import NotFound from './pages/NotFound';

const ExamPage = lazy(() => import('./pages/ExamPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage'));
const AdminRequestsPage = lazy(() => import('./pages/admin/AdminRequestsPage'));

const Loading = () => <div className="mx-auto max-w-[900px] px-4 pt-16"><div className="h-10 w-2/3 rounded-lg skeleton" /></div>;

/** Pages an admin account can open. Everything else (the learning site) sends them to the admin panel. */
const ADMIN_PATHS = [/^\/admin(\/|$)/, /^\/(account|settings)$/, /^\/(privacy|terms|cookies)$/];

function RoleGate({ children }: { children: ReactNode }) {
  const isAdmin = useAuth((s) => s.user?.role === 'admin');
  const { pathname } = useLocation();
  if (isAdmin && !ADMIN_PATHS.some((re) => re.test(pathname))) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

/* HashRouter keeps every route working on any static host (no server rewrites needed). */
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <RoleGate>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:courseId" element={<CoursePage />} />
                <Route path="/course/:courseId/exam" element={<ExamPage />} />
                <Route path="/course/:courseId/:lessonId" element={<LessonPage />} />
                <Route path="/certificate/:courseId" element={<CertificatePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/playground" element={<PlaygroundPage />} />
                <Route path="/glossary" element={<GlossaryPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/start" element={<StaticPage name="start" />} />
                <Route path="/cheatsheet" element={<StaticPage name="cheatsheet" />} />
                <Route path="/resources" element={<StaticPage name="resources" />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/privacy" element={<PolicyPage which="privacy" />} />
                <Route path="/terms" element={<PolicyPage which="terms" />} />
                <Route path="/cookies" element={<PolicyPage which="cookies" />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/requests" element={<AdminRequestsPage />} />
                <Route path="/admin/users/:userId" element={<AdminUserPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RoleGate>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </HashRouter>
  );
}
