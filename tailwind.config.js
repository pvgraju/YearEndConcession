/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "hsl(14, 80%, 42%)",
          light: "hsl(14, 80%, 95%)",
          dark: "hsl(14, 80%, 32%)",
        },
        surface: {
          DEFAULT: "hsl(220, 14%, 98%)",
          card: "hsl(0, 0%, 100%)",
          muted: "hsl(220, 14%, 96%)",
        },
        ink: {
          DEFAULT: "hsl(220, 20%, 14%)",
          muted: "hsl(220, 10%, 46%)",
          light: "hsl(220, 10%, 64%)",
        },
        status: {
          danger: "hsl(0, 84%, 60%)",
          warning: "hsl(38, 92%, 50%)",
          success: "hsl(142, 71%, 45%)",
        },
        edge: "hsl(220, 13%, 91%)",
      },
    },
  },
  plugins: [],
};
