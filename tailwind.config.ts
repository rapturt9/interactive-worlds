import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            '--tw-prose-body': 'var(--text-primary)',
            '--tw-prose-headings': 'var(--text-primary)',
            '--tw-prose-lead': 'var(--text-primary)',
            '--tw-prose-links': 'var(--accent)',
            '--tw-prose-bold': 'var(--text-primary)',
            '--tw-prose-counters': 'var(--text-secondary)',
            '--tw-prose-bullets': 'var(--text-secondary)',
            '--tw-prose-hr': 'var(--border)',
            '--tw-prose-quotes': 'var(--text-primary)',
            '--tw-prose-quote-borders': 'var(--accent)',
            '--tw-prose-captions': 'var(--text-secondary)',
            '--tw-prose-code': 'var(--text-primary)',
            '--tw-prose-pre-code': 'var(--text-primary)',
            '--tw-prose-pre-bg': 'var(--bg-tertiary)',
            '--tw-prose-th-borders': 'var(--border)',
            '--tw-prose-td-borders': 'var(--border)',
            // Invert colors (same as default since we use CSS variables)
            '--tw-prose-invert-body': 'var(--text-primary)',
            '--tw-prose-invert-headings': 'var(--text-primary)',
            '--tw-prose-invert-lead': 'var(--text-primary)',
            '--tw-prose-invert-links': 'var(--accent)',
            '--tw-prose-invert-bold': 'var(--text-primary)',
            '--tw-prose-invert-counters': 'var(--text-secondary)',
            '--tw-prose-invert-bullets': 'var(--text-secondary)',
            '--tw-prose-invert-hr': 'var(--border)',
            '--tw-prose-invert-quotes': 'var(--text-primary)',
            '--tw-prose-invert-quote-borders': 'var(--accent)',
            '--tw-prose-invert-captions': 'var(--text-secondary)',
            '--tw-prose-invert-code': 'var(--text-primary)',
            '--tw-prose-invert-pre-code': 'var(--text-primary)',
            '--tw-prose-invert-pre-bg': 'var(--bg-tertiary)',
            '--tw-prose-invert-th-borders': 'var(--border)',
            '--tw-prose-invert-td-borders': 'var(--border)',
            color: 'var(--text-primary)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
