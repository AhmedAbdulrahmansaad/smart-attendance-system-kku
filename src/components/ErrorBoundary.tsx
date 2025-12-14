import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ErrorBoundary] Caught error:', error);
    console.error('❌ [ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg">
                حدث خطأ غير متوقع / An Unexpected Error Occurred
              </AlertTitle>
              <AlertDescription className="mt-4 space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold">تفاصيل الخطأ:</p>
                  <div className="bg-destructive/10 p-4 rounded-md font-mono text-sm overflow-auto">
                    {this.state.error?.toString()}
                  </div>
                </div>

                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold hover:underline">
                      عرض التفاصيل التقنية
                    </summary>
                    <div className="mt-2 bg-destructive/10 p-4 rounded-md font-mono text-xs overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </details>
                )}

                <div className="flex gap-2 mt-6">
                  <Button onClick={this.handleReset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    إعادة تحميل الصفحة / Reload Page
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md text-sm space-y-2">
                  <p className="font-semibold">💡 نصائح لحل المشكلة:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>تأكد من اتصالك بالإنترنت</li>
                    <li>تحقق من إعدادات Supabase في /config/supabase.config.ts</li>
                    <li>تأكد من أن جميع الجداول موجودة في قاعدة البيانات</li>
                    <li>افتح Console (F12) لمزيد من التفاصيل</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
