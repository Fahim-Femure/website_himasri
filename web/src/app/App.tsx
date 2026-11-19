import { MotionConfig } from 'motion/react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ErrorBoundary } from '@/pages/errors/ErrorBoundary';
import { router } from '@/routes/router';

export function App() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            richColors
            position={isMobile ? 'top-center' : 'bottom-right'}
            toastOptions={{
              className: 'glass-light',
              style: {
                fontFamily:
                  '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
              },
            }}
          />
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
