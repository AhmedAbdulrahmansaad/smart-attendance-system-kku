import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase.config';

// محاولة قراءة المفاتيح من Environment Variables أولاً (للنشر على Vercel)
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

// إذا لم تكن موجودة في Environment Variables، استخدم من ملف Config (للتطوير المحلي/Figma Make)
const supabaseUrl = envUrl || supabaseConfig.SUPABASE_URL;
const supabaseAnonKey = envKey || supabaseConfig.SUPABASE_ANON_KEY;

// التحقق من صحة المفاتيح
const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-public-key-here';

if (!isConfigured) {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('❌ Supabase غير مكوّن! Supabase Not Configured!');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');
  console.error('📝 للاختبار في Figma Make:');
  console.error('   1. افتح: /config/supabase.config.ts');
  console.error('   2. استبدل SUPABASE_URL بـ Project URL من Supabase');
  console.error('   3. استبدل SUPABASE_ANON_KEY بـ anon key من Supabase');
  console.error('   4. احفظ الملف وأعد تحميل الصفحة');
  console.error('');
  console.error('🌐 كيف تحصل على المفاتيح:');
  console.error('   → https://supabase.com/dashboard');
  console.error('   → Settings → API');
  console.error('   → انسخ Project URL و anon public key');
  console.error('');
  console.error('🚀 للنشر على Vercel:');
  console.error('   1. Vercel Dashboard → Settings → Environment Variables');
  console.error('   2. أضف: VITE_SUPABASE_URL');
  console.error('   3. أضف: VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');
}

// إنشاء الـ client (حتى لو لم يكن مكوّن، لتجنب أخطاء الـ imports)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// دالة جاهزة للاستخدام في باقي الملفات
export function getSupabaseClient() {
  return supabase;
}

// دالة للتحقق من التكوين
export function isSupabaseConfigured() {
  return isConfigured;
}

// دالة للتحقق من الاتصال
export async function checkConnection() {
  if (!isConfigured) {
    console.warn('⚠️ Supabase not configured. Please check /config/supabase.config.ts');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('kv_store_90ad488b').select('key').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}