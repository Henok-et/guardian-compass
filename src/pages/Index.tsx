// Update this page (the content is just a fallback if you fail to update the page)

import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

export default Index;
