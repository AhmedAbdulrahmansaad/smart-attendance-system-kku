/**
 * نظام البصمة الفريدة للأجهزة (Device Fingerprinting)
 * لمنع تسجيل الدخول المتزامن والتحقق من هوية الطالب الحقيقية
 * 
 * يستخدم تقنيات متقدمة لإنشاء بصمة فريدة لكل جهاز تشمل:
 * - معلومات المتصفح والنظام
 * - معلومات الشاشة والأجهزة
 * - معلومات الشبكة والموقع
 * - معلومات الأجهزة المتصلة
 */

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  vendor: string;
  webgl: string;
  canvas: string;
  audio: string;
  fonts: string[];
  plugins: string[];
  timestamp: number;
  ip?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

/**
 * إنشاء hash من نص باستخدام SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * الحصول على بصمة Canvas
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // رسم نص مع خصائص مختلفة
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('KKU Attendance 🎓', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Fingerprint', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

/**
 * الحصول على بصمة WebGL
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}|${renderer}`;
  } catch (e) {
    return 'webgl-error';
  }
}

/**
 * الحصول على بصمة Audio
 */
function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve('no-audio');
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0; // صامت
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      scriptProcessor.onaudioprocess = function(event) {
        const output = event.outputBuffer.getChannelData(0);
        const hash = Array.from(output.slice(0, 30))
          .map(val => Math.abs(val).toString())
          .join('');
        
        oscillator.disconnect();
        scriptProcessor.disconnect();
        gainNode.disconnect();
        context.close();
        
        resolve(hash.substring(0, 50));
      };

      oscillator.start(0);
    } catch (e) {
      resolve('audio-error');
    }
  });
}

/**
 * الحصول على قائمة الخطوط المثبتة
 */
function getInstalledFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Lucida Sans Unicode',
    'Arial Black', 'Century Gothic', 'Monaco', 'Helvetica'
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const detected: string[] = [];

  function getWidth(font: string, base: string): number {
    ctx.font = `72px ${font}, ${base}`;
    return ctx.measureText('mmmmmmmmmmlli').width;
  }

  const baseWidths: { [key: string]: number } = {};
  baseFonts.forEach(base => {
    baseWidths[base] = getWidth(base, base);
  });

  testFonts.forEach(font => {
    let detected_font = false;
    baseFonts.forEach(base => {
      const width = getWidth(font, base);
      if (width !== baseWidths[base]) {
        detected_font = true;
      }
    });
    if (detected_font) {
      detected.push(font);
    }
  });

  return detected;
}

/**
 * الحصول على قائمة الإضافات (Plugins)
 */
function getPlugins(): string[] {
  const plugins: string[] = [];
  
  if (navigator.plugins && navigator.plugins.length > 0) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push(plugin.name);
    }
  }

  return plugins;
}

/**
 * الحصول على الموقع الجغرافي
 */
async function getGeolocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 0,
        enableHighAccuracy: false
      }
    );
  });
}

/**
 * الحصول على عنوان IP (من خلال خدمة خارجية)
 */
async function getIPAddress(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return data.ip || null;
  } catch (e: any) {
    // Silent - IP detection is optional
    return null;
  }
}

/**
 * إنشاء بصمة الجهاز الكاملة
 */
export async function generateDeviceFingerprint(): Promise<DeviceInfo> {
  console.log('🔍 Starting device fingerprint generation...');

  // جمع معلومات أساسية
  const basicInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    vendor: navigator.vendor || 'unknown',
    timestamp: Date.now()
  };

  // جمع البصمات المتقدمة
  console.log('🎨 Generating canvas fingerprint...');
  const canvas = getCanvasFingerprint();
  
  console.log('🎮 Generating WebGL fingerprint...');
  const webgl = getWebGLFingerprint();
  
  console.log('🔊 Generating audio fingerprint...');
  const audio = await getAudioFingerprint();
  
  console.log('🔤 Detecting installed fonts...');
  const fonts = getInstalledFonts();
  
  console.log('🔌 Detecting plugins...');
  const plugins = getPlugins();

  // جمع معلومات الشبكة والموقع
  console.log('📍 Getting geolocation...');
  const location = await getGeolocation();
  
  console.log('🌐 Getting IP address...');
  const ip = await getIPAddress();

  // إنشاء النص الكامل للبصمة
  const fingerprintString = [
    basicInfo.userAgent,
    basicInfo.platform,
    basicInfo.language,
    basicInfo.screenResolution,
    basicInfo.colorDepth,
    basicInfo.timezone,
    basicInfo.hardwareConcurrency,
    basicInfo.deviceMemory,
    basicInfo.maxTouchPoints,
    basicInfo.vendor,
    canvas,
    webgl,
    audio,
    fonts.join(','),
    plugins.join(',')
  ].join('|');

  // إنشاء hash للبصمة
  console.log('🔐 Creating fingerprint hash...');
  const fingerprint = await hashString(fingerprintString);

  const deviceInfo: DeviceInfo = {
    ...basicInfo,
    canvas,
    webgl,
    audio,
    fonts,
    plugins,
    fingerprint,
    ip: ip || undefined,
    location: location || undefined
  };

  console.log('✅ Device fingerprint generated:', {
    fingerprint,
    platform: basicInfo.platform,
    vendor: basicInfo.vendor,
    fontsDetected: fonts.length,
    hasLocation: !!location,
    hasIP: !!ip
  });

  return deviceInfo;
}

/**
 * التحقق من تطابق البصمة
 */
export function verifyFingerprint(stored: string, current: string): boolean {
  return stored === current;
}

/**
 * حفظ البصمة في LocalStorage
 */
export function saveFingerprintToStorage(deviceInfo: DeviceInfo): void {
  try {
    localStorage.setItem('device_fingerprint', deviceInfo.fingerprint);
    localStorage.setItem('device_info', JSON.stringify({
      platform: deviceInfo.platform,
      vendor: deviceInfo.vendor,
      timestamp: deviceInfo.timestamp
    }));
    console.log('💾 Device fingerprint saved to localStorage');
  } catch (e) {
    console.warn('Failed to save fingerprint to localStorage:', e);
  }
}

/**
 * الحصول على البصمة من LocalStorage
 */
export function getFingerprintFromStorage(): string | null {
  try {
    return localStorage.getItem('device_fingerprint');
  } catch (e) {
    console.warn('Failed to get fingerprint from localStorage:', e);
    return null;
  }
}

/**
 * التحقق من تغيير الجهاز
 */
export async function detectDeviceChange(): Promise<boolean> {
  const storedFingerprint = getFingerprintFromStorage();
  if (!storedFingerprint) {
    return false; // لا توجد بصمة سابقة
  }

  const currentDeviceInfo = await generateDeviceFingerprint();
  const hasChanged = !verifyFingerprint(storedFingerprint, currentDeviceInfo.fingerprint);

  if (hasChanged) {
    console.warn('⚠️ Device fingerprint has changed!');
    console.log('Stored:', storedFingerprint);
    console.log('Current:', currentDeviceInfo.fingerprint);
  }

  return hasChanged;
}

/**
 * مسح البصمة من LocalStorage (عند تسجيل الخروج)
 */
export function clearFingerprintFromStorage(): void {
  try {
    localStorage.removeItem('device_fingerprint');
    localStorage.removeItem('device_info');
    console.log('🗑️ Device fingerprint cleared from localStorage');
  } catch (e) {
    console.warn('Failed to clear fingerprint from localStorage:', e);
  }
}

/**
 * إنشاء ملخص قابل للقراءة لمعلومات الجهاز
 */
export function getDeviceSummary(deviceInfo: DeviceInfo): string {
  const browser = deviceInfo.userAgent.includes('Chrome') ? 'Chrome' :
                  deviceInfo.userAgent.includes('Firefox') ? 'Firefox' :
                  deviceInfo.userAgent.includes('Safari') ? 'Safari' :
                  deviceInfo.userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = deviceInfo.platform.includes('Win') ? 'Windows' :
             deviceInfo.platform.includes('Mac') ? 'macOS' :
             deviceInfo.platform.includes('Linux') ? 'Linux' :
             deviceInfo.platform.includes('Android') ? 'Android' :
             deviceInfo.platform.includes('iOS') ? 'iOS' : 'Unknown';

  return `${os} - ${browser} - ${deviceInfo.screenResolution}`;
}

/**
 * التحقق من الجهاز المشبوه
 * يتحقق من علامات محتملة لاستخدام VPN أو Proxy أو أجهزة وهمية
 */
export function detectSuspiciousDevice(deviceInfo: DeviceInfo): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // التحقق من عدم وجود Canvas
  if (deviceInfo.canvas === 'no-canvas' || deviceInfo.canvas === 'canvas-error') {
    reasons.push('Canvas not available or blocked');
  }

  // التحقق من عدم وجود WebGL
  if (deviceInfo.webgl === 'no-webgl' || deviceInfo.webgl === 'webgl-error') {
    reasons.push('WebGL not available or blocked');
  }

  // التحقق من عدد قليل جداً من الخطوط
  if (deviceInfo.fonts.length < 5) {
    reasons.push('Suspiciously low number of fonts detected');
  }

  // التحقق من عدم وجود plugins (في متصفحات غير Chrome)
  if (deviceInfo.plugins.length === 0 && !deviceInfo.userAgent.includes('Chrome')) {
    reasons.push('No plugins detected');
  }

  // التحقق من hardwareConcurrency غير واقعي
  if (deviceInfo.hardwareConcurrency > 128 || deviceInfo.hardwareConcurrency === 0) {
    reasons.push('Unrealistic CPU core count');
  }

  // التحقق من deviceMemory غير واقعي
  if (deviceInfo.deviceMemory && (deviceInfo.deviceMemory > 32 || deviceInfo.deviceMemory < 0.5)) {
    reasons.push('Unrealistic device memory');
  }

  return {
    isSuspicious: reasons.length >= 3, // يُعتبر مشبوهاً إذا كان هناك 3 علامات أو أكثر
    reasons
  };
}

export default {
  generateDeviceFingerprint,
  verifyFingerprint,
  saveFingerprintToStorage,
  getFingerprintFromStorage,
  detectDeviceChange,
  clearFingerprintFromStorage,
  getDeviceSummary,
  detectSuspiciousDevice
};