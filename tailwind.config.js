/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 中医风格配色
        primary: {
          50: '#fef7f0',
          100: '#fdedd8',
          200: '#fbd7ac',
          300: '#f8bc77',
          400: '#f4983d',
          500: '#e87d2a',
          600: '#d4621c',
          700: '#b14a1a',
          800: '#8e3c1c',
          900: '#75341b',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // 舌象颜色（用于特征标识）
        tongue: {
          pale: '#fecaca',      // 淡白
          light: '#fca5a5',     // 淡红
          red: '#ef4444',       // 红
          crimson: '#dc2626',   // 绛
          purple: '#7c3aed',    // 紫
          blue: '#3b82f6',      // 青紫
        },
        // 苔色
        coating: {
          thin: '#fef9c3',      // 薄白
          white: '#f5f5f4',     // 白厚
          yellow: '#fbbf24',    // 黄
          grey: '#6b7280',      // 灰黑
        },
        // 脏腑颜色
        organ: {
          heart: '#ef4444',     // 心 - 红
          liver: '#22c55e',    // 肝 - 绿
          spleen: '#f59e0b',   // 脾 - 黄
          lung: '#ffffff',     // 肺 - 白
          kidney: '#3b82f6',   // 肾 - 蓝
          stomach: '#f97316',  // 胃 - 橙
        },
      },
      fontFamily: {
        chinese: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
        sans: ['"Inter"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'tcm': '0 4px 14px 0 rgba(232, 125, 42, 0.15)',
        'tcm-lg': '0 10px 40px 0 rgba(232, 125, 42, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
