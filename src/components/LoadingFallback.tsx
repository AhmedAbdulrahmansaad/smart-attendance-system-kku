import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface LoadingFallbackProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
  timeout?: number;
}

export function LoadingFallback({
  onRetry,
  title = 'جارٍ التحميل',
  message = 'الرجاء الانتظار...',
  showRetry = true,
  timeout = 8000 // 8 seconds
}: LoadingFallbackProps) {
  const [isTimeout, setIsTimeout] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Timeout detection
    const timeoutId = setTimeout(() => {
      setIsTimeout(true);
    }, timeout);

    return () => {
      clearInterval(dotsInterval);
      clearTimeout(timeoutId);
    };
  }, [timeout]);

  if (isTimeout && showRetry) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">استغرق التحميل وقتاً أطول من المتوقع</h3>
          
          <p className="text-muted-foreground mb-6">
            قد تكون هناك مشكلة في الاتصال بالخادم. جرّب الخيارات التالية:
          </p>

          <div className="space-y-3">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
              size="lg"
            >
              تحديث الصفحة
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground space-y-2">
            <p className="font-medium">نصائح للحل:</p>
            <ul className="list-disc list-inside space-y-1 text-right">
              <li>تحقق من اتصالك بالإنترنت</li>
              <li>جرّب متصفح آخر (Chrome, Firefox)</li>
              <li>امسح ذاكرة التخزين المؤقت (Ctrl+Shift+Delete)</li>
              <li>تأكد من تفعيل خدمة Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h3 className="mt-4 text-lg font-medium">
          {title}{dots}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {message}
        </p>

        <div className="mt-4 flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
