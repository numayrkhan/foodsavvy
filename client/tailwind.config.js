export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: '#54A05F',
        'accent-dark': '#487f51',
        beige: '#DDC3A5',
        dark: '#201E20',
        gray: {
          100: '#f7fafc',
          200: '#edf2f7',
          900: '#1a202c',
        },
      },
      fontFamily: {
        display: ['Lobster', 'cursive'],
        sans: ['"Open Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
