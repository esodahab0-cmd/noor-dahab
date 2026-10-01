import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf0',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          DEFAULT: '#F59E0B',
        },
        dark: {
          900: '#020617', /* Slate-950 for WCAG AAA */
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
        }
      },
    },
  },
  plugins: [],
};
export default config;
