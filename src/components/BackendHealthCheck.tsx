import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface HealthCheckResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export function BackendHealthCheck() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Get environment variables
  const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
  
  // Extract project ID from URL
  const projectId = supabaseUrl ? supabaseUrl.replace('https://', '').replace('.supabase.co', '') : '';

  const addResult = (result: HealthCheckResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runHealthCheck = async () => {
    setResults([]);
    setIsRunning(true);

    // Test 1: Check Environment Variables
    addResult({
      test: 'Environment Variables',
      status: projectId && supabaseAnonKey ? 'success' : 'error',
      message: projectId && supabaseAnonKey 
        ? 'Supabase URL and Anon Key found' 
        : 'Missing environment variables',
      details: {
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
      }
    });

    // Test 2: Check Health Endpoint
    const healthUrl = `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/health`;
    try {
      console.log('🏥 Testing health endpoint:', healthUrl);
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🏥 Health response status:', response.status);
      const data = await response.json();
      console.log('🏥 Health response data:', data);

      addResult({
        test: 'Health Endpoint',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Backend is running (${response.status})` 
          : `Backend returned error (${response.status})`,
        details: { url: healthUrl, status: response.status, data }
      });
    } catch (error: any) {
      console.error('🏥 Health check error:', error);
      addResult({
        test: 'Health Endpoint',
        status: 'error',
        message: `Failed to connect: ${error.message}`,
        details: { 
          url: healthUrl, 
          error: error.message,
          errorType: error.name,
          fullError: error.toString()
        }
      });
    }

    // Test 3: Check Auth Token
    const accessToken = localStorage.getItem('access_token');
    addResult({
      test: 'Auth Token',
      status: accessToken ? 'success' : 'warning',
      message: accessToken ? 'User logged in' : 'No user logged in (expected if not authenticated)',
      details: {
        hasToken: !!accessToken,
        tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'N/A'
      }
    });

    // Test 4: Test /sessions endpoint (if logged in)
    if (accessToken) {
      const sessionsUrl = `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/sessions`;
      try {
        console.log('📡 Testing sessions endpoint:', sessionsUrl);
        const response = await fetch(sessionsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('📡 Sessions response status:', response.status);
        const data = await response.json();
        console.log('📡 Sessions response data:', data);

        addResult({
          test: '/sessions Endpoint',
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? `Sessions endpoint working (${response.status})` 
            : `Sessions endpoint error (${response.status})`,
          details: { url: sessionsUrl, status: response.status, data }
        });
      } catch (error: any) {
        console.error('📡 Sessions check error:', error);
        addResult({
          test: '/sessions Endpoint',
          status: 'error',
          message: `Failed to fetch sessions: ${error.message}`,
          details: { 
            url: sessionsUrl, 
            error: error.message,
            errorType: error.name,
            fullError: error.toString()
          }
        });
      }
    }

    // Test 5: Check Network Connection
    try {
      const pingResponse = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      addResult({
        test: 'Internet Connection',
        status: 'success',
        message: 'Internet connection is working',
        details: { online: navigator.onLine }
      });
    } catch (error) {
      addResult({
        test: 'Internet Connection',
        status: 'error',
        message: 'No internet connection',
        details: { online: navigator.onLine }
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run on mount
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBgColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Backend Health Check</span>
          <Button 
            onClick={runHealthCheck} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Re-run Tests'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 && isRunning && (
          <Alert>
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>Running health checks...</AlertDescription>
          </Alert>
        )}

        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusBgColor(result.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{result.test}</h3>
                <p className="text-sm mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer hover:underline">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-white/50 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}

        {results.length > 0 && !isRunning && (
          <Alert>
            <AlertDescription>
              <strong>Summary:</strong> {results.filter(r => r.status === 'success').length} passed, {' '}
              {results.filter(r => r.status === 'error').length} failed, {' '}
              {results.filter(r => r.status === 'warning').length} warnings
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">📋 Troubleshooting Guide:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              <strong>Failed to fetch:</strong> Edge Function is not deployed or not accessible
            </li>
            <li>
              <strong>401 Unauthorized:</strong> User not logged in or token expired
            </li>
            <li>
              <strong>404 Not Found:</strong> Wrong function name or route
            </li>
            <li>
              <strong>500 Internal Error:</strong> Server error - check Edge Function logs
            </li>
            <li>
              <strong>CORS Error:</strong> CORS not properly configured on server
            </li>
          </ul>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>ℹ️ Note:</strong> In Figma Make environment, Edge Functions should be automatically deployed. 
            If the health check fails with "Failed to fetch", the Edge Function may need to be deployed manually 
            or there may be an issue with the Supabase project configuration.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}