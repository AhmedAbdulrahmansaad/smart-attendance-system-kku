import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to reset state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
          <Card className="max-w-2xl w-full border-2 border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-destructive">
                    حدث خطأ غير متوقع
                  </CardTitle>
                  <CardDescription className="text-base">
                    Something went wrong
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="font-mono text-sm text-destructive">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {/* Error Details (Development) */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="p-4 rounded-lg bg-muted">
                  <summary className="cursor-pointer font-medium mb-2">
                    تفاصيل تقنية (للمطورين فقط)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 p-2 bg-background rounded border">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تحميل الصفحة</span>
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  العودة للرئيسية
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                <p>إذا استمرت المشكلة، يرجى:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>مسح ذاكرة التخزين المؤقت للمتصفح</li>
                  <li>التحقق من اتصال الإنترنت</li>
                  <li>تحديث الصفحة (Ctrl + Shift + R)</li>
                  <li>التواصل مع الدعم الفني</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
