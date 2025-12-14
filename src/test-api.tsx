import { useEffect, useState } from 'react';

// Test API Connection
export default function TestAPI() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/server';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ';

  const addResult = (message: string, isError = false) => {
    setResults(prev => [...prev, { message, isError, time: new Date().toISOString() }]);
  };

  const testHealthCheck = async () => {
    setResults([]);
    setLoading(true);
    
    addResult('🔍 Testing Health Check Endpoint...');
    addResult(`📡 URL: ${BASE_URL}/make-server-90ad488b/health`);
    
    try {
      addResult('⏳ Sending request...');
      
      const response = await fetch(`${BASE_URL}/make-server-90ad488b/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      
      addResult(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        addResult('✅ SUCCESS! Backend is responding!');
        addResult(`Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const text = await response.text();
        addResult(`❌ ERROR: ${response.status}`, true);
        addResult(`Response: ${text}`, true);
      }
    } catch (error: any) {
      addResult(`❌ FETCH ERROR: ${error.message}`, true);
      addResult('This usually means:', true);
      addResult('1. CORS is blocking the request', true);
      addResult('2. Edge Function is not deployed', true);
      addResult('3. URL is incorrect', true);
    }
    
    setLoading(false);
  };

  const testDirectURL = async () => {
    setResults([]);
    setLoading(true);
    
    const testUrls = [
      `${BASE_URL}/make-server-90ad488b/health`,
      `${BASE_URL}/health`,
      'https://pcymgqdjbdklrikdquih.supabase.co/functions/v1/make-server-90ad488b/health',
    ];
    
    for (const url of testUrls) {
      addResult(`\n📡 Testing: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
          }
        });
        
        if (response.ok) {
          addResult(`  ✅ ${response.status} - Working!`);
          const data = await response.json();
          addResult(`  Data: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          addResult(`  ❌ ${response.status} - ${response.statusText}`, true);
        }
      } catch (error: any) {
        addResult(`  ❌ FAILED: ${error.message}`, true);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl mb-4" style={{ color: '#006747' }}>
            🔍 اختبار Backend API
          </h1>
          <p className="text-gray-600 mb-6">
            اختبار الاتصال بالـBackend للتأكد من أن الـEdge Function يعمل بشكل صحيح
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testHealthCheck}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-white disabled:opacity-50"
              style={{ background: '#006747' }}
            >
              {loading ? '⏳ جاري الاختبار...' : '🧪 اختبار Health Check'}
            </button>
            
            <button
              onClick={testDirectURL}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-white disabled:opacity-50"
              style={{ background: '#006747' }}
            >
              {loading ? '⏳ جاري الاختبار...' : '🔍 اختبار URLs مختلفة'}
            </button>
          </div>

          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
            <div className="mb-4">
              <div className="text-blue-400">📋 Configuration:</div>
              <div className="ml-4 mt-2">
                <div>Project ID: pcymgqdjbdklrikdquih</div>
                <div>Base URL: {BASE_URL}</div>
                <div>Health URL: {BASE_URL}/make-server-90ad488b/health</div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="text-blue-400 mb-2">📊 Results:</div>
              {results.length === 0 ? (
                <div className="text-gray-500">اضغط على زر الاختبار للبدء...</div>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={result.isError ? 'text-red-400' : 'text-green-400'}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {result.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h2 className="text-xl mb-3 text-yellow-900">⚠️ إذا فشلت الاختبارات:</h2>
          <ol className="list-decimal mr-6 space-y-2 text-yellow-900">
            <li>تأكد أن الـEdge Function deployed على Supabase</li>
            <li>تأكد أن اسم الـFunction هو <code className="bg-yellow-200 px-2 py-1 rounded">server</code></li>
            <li>تأكد من CORS settings في Backend</li>
            <li>جرب افتح الـURL في browser مباشرة:</li>
          </ol>
          <div className="mt-3 bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all">
            {BASE_URL}/make-server-90ad488b/health
          </div>
        </div>
      </div>
    </div>
  );
}
