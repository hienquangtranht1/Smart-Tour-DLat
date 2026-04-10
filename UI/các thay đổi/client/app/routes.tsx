import { createHashRouter, Navigate, Outlet } from 'react-router';
import { PublicLayout } from './components/layouts/PublicLayout';
import { UserSidebar } from './components/layouts/UserSidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { NotFound } from './pages/NotFound';

// User Pages
import { AIPlanner } from './pages/user/AIPlanner';
import { Marketplace } from './pages/user/Marketplace';
import { Trips } from './pages/user/Trips';
import { Profile } from './pages/user/Profile';
import { Map } from './pages/user/Map';
import { PaymentSuccess } from './pages/user/PaymentSuccess';
import { PaymentFailure } from './pages/user/PaymentFailure';

export const router = createHashRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout><Home /></PublicLayout>,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/explore',
    element: <PublicLayout><Marketplace /></PublicLayout>,
  },
  {
    path: '/become-partner',
    element: <Navigate to="/auth?role=staff" replace />,
  },
  {
    path: '/payment/success',
    element: <PaymentSuccess />,
  },
  {
    path: '/payment/failure',
    element: <PaymentFailure />,
  },

  // User Routes
  {
    path: '/user',
    element: (
      <ProtectedRoute allowedRoles={['USER']}>
        <UserSidebar>
          <Outlet />
        </UserSidebar>
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/user/ai-planner" replace />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/user/ai-planner" replace />,
      },
      {
        path: 'ai-planner',
        element: <AIPlanner />,
      },
      {
        path: 'marketplace',
        element: <Marketplace />,
      },
      {
        path: 'trips',
        element: <Trips />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'map',
        element: <Map />,
      },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: <NotFound />,
  },
]);
