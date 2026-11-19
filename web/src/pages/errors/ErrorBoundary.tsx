import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function reportErrorToSentry(error: Error, componentStack?: string | null) {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace(/^\//, '');
    const publicKey = parsed.username;
    if (!projectId || !publicKey) return;

    const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/?sentry_key=${encodeURIComponent(publicKey)}&sentry_version=7`;
    const payload = {
      message: error.message || 'Unhandled React Error',
      level: 'error',
      platform: 'javascript',
      environment: import.meta.env.MODE,
      extra: {
        stack: error.stack || '',
        componentStack: componentStack || '',
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
    };
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignore malformed DSN
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
    reportErrorToSentry(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-cream-50 px-6 py-12">
          <div className="max-w-md rounded-lg bg-white border border-cream-200 p-8 text-center space-y-4">
            <div className="mx-auto flex justify-center text-danger-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="type-app-h2 text-ink-900">Terjadi gangguan tampilan</h1>
            <p className="type-small text-ink-600">
              Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Muat ulang halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
