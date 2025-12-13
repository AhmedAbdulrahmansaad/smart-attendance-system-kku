import React from 'react';
import { AlertTriangle, Terminal, FileText, ExternalLink } from 'lucide-react';

/**
 * تحذير يظهر عندما لا يكون Backend منشوراً
 */
export function DeploymentWarning() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-2xl p-6 border-2 border-white/20">
        {/* العنوان */}
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold mb-1">
              ⚠️ Backend Not Deployed Yet!
            </h3>
            <p className="text-sm opacity-90">
              النظام الخلفي لم يتم رفعه بعد! | Backend system not deployed yet!
            </p>
          </div>
        </div>

        {/* الرسالة */}
        <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
          <p className="text-sm mb-2">
            The system is ready to use, but you need to deploy the backend first.
          </p>
          <p className="text-sm text-white/80 mb-2" dir="rtl">
            النظام جاهز للاستخدام، لكن يجب عليك رفع النظام الخلفي أولاً.
          </p>
          <p className="text-xs text-white/60">
            This is a one-time setup that takes only 5 minutes!
          </p>
        </div>

        {/* الخطوات السريعة */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Quick Deploy (Recommended)</p>
              <code className="bg-black/30 px-3 py-1.5 rounded text-xs block font-mono">
                ./deploy.sh
              </code>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Or Manual Deploy</p>
              <p className="text-xs opacity-80">
                Dashboard → Edge Functions → Deploy "server"
              </p>
            </div>
          </div>
        </div>

        {/* الروابط */}
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-3">
          <a
            href="https://github.com/yourusername/project/blob/main/🔥_FIX_404_NOW.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Fix 404 Guide
          </a>
          
          <a
            href="https://github.com/yourusername/project/blob/main/📖_START_HERE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Full Guide
          </a>

          <a
            href="https://supabase.com/dashboard/project/pcymgqdjbdklrikdquih"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Open Dashboard
          </a>
        </div>

        {/* زر الإغلاق */}
        <button
          onClick={() => {
            const warning = document.getElementById('deployment-warning');
            if (warning) warning.style.display = 'none';
          }}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * تحذير مصغر يظهر في الزاوية
 */
export function DeploymentBadge() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (isExpanded) {
    return <DeploymentWarning />;
  }

  return (
    <button
      onClick={() => setIsExpanded(true)}
      className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105 flex items-center gap-2 animate-pulse"
    >
      <AlertTriangle className="w-5 h-5" />
      <span className="font-semibold">Backend Not Deployed</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
        Click to fix
      </span>
    </button>
  );
}
