import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('USER' | 'STAFF' | 'ADMIN')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Redirect to login but save the attempted url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    // Role not authorized, redirect to their respective dashboard
    const redirectPath = user.role?.toLowerCase() || 'user';
    return <Navigate to={`/${redirectPath}/dashboard`} replace />;
  }

  return <>{children}</>;
}
