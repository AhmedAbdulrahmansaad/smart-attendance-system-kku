// هذا ملف يحتوي على الـ endpoints العامة التي يجب إضافتها لـ index.tsx

// ==================== PUBLIC ENDPOINTS (لا تحتاج authentication) ====================

// Get public stats for landing page - أضف هذا في index.tsx
app.get("/make-server-90ad488b/stats/public", async (c) => {
  try {
    console.log('📊 GET /stats/public - Fetching public statistics');
    
    const stats = await db.getPublicStats();
    
    console.log('✅ Public stats retrieved:', stats);
    
    return c.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.log('❌ Get public stats error:', error);
    return c.json({ 
      success: false,
      error: 'Internal server error while fetching public stats',
      stats: {
        studentsCount: 0,
        instructorsCount: 0,
        coursesCount: 0,
        attendanceRate: 0
      }
    }, 500);
  }
});
