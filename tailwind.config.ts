import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black: '#0A0A0F',
        navy: '#1B2E6B',
        navy2: '#253A85',
        navy3: '#93AFFD',
        slate: '#1C2333',
        mid: '#8892A4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
