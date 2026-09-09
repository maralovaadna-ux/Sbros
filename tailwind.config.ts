import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0F',
        accent: '#FF3B30',
        accent2: '#00D0A0',
        surface: '#151519',
        muted: '#8A8A93',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
export default config
