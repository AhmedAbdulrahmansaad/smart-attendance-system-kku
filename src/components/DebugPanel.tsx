import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

export function DebugPanel() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Fetch all data
      const [coursesRes, sessionsRes] = await Promise.all([
        apiRequest('/courses', { token }),
        apiRequest('/sessions', { token })
      ]);

      setData({
        courses: coursesRes.courses || [],
        sessions: sessionsRes.data?.sessions || [],
        userCourses: sessionsRes.data?.courses || []
      });
    } catch (err: any) {
      console.error('Debug fetch error:', err);
      setData({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🔍 Debug Panel (التشخيص)</CardTitle>
          <Button onClick={fetchDebugData} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="text-muted-foreground">انقر على Refresh لعرض البيانات</p>
        ) : (
          <div className="space-y-4">
            {data.error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded">
                Error: {data.error}
              </div>
            ) : (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <h3 className="font-bold mb-2">📚 All Courses ({data.courses?.length || 0})</h3>
                  <pre className="text-xs overflow-auto max-h-48">
                    {JSON.stringify(data.courses, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded">
                  <h3 className="font-bold mb-2">📋 Live Sessions ({data.sessions?.length || 0})</h3>
                  <pre className="text-xs overflow-auto max-h-48">
                    {JSON.stringify(data.sessions, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded">
                  <h3 className="font-bold mb-2">🎓 User Courses ({data.userCourses?.length || 0})</h3>
                  <pre className="text-xs overflow-auto max-h-48">
                    {JSON.stringify(data.userCourses, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
