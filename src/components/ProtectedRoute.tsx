import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-mono" style={{ color: '#646669', fontSize: 13 }}>loading…</div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  return <>{children}</>;
}
