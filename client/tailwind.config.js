/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: '#F4F4F5',
          100: '#F4F4F5',
          200: '#E4E4E7',
          900: '#09090B',
        },
        brand: {
          blue: '#2563EB', // Ajustar al azul del logo si es necesario
          yellow: '#FACC15', // Reservado para alertas
        }
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
