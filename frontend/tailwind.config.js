/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Nunito: redondeada y muy legible para lectores que recién empiezan.
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        // Violeta cálido: curiosidad e imaginación, con buen contraste sobre blanco.
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(0 0 0 / 0.06), 0 6px 24px -6px rgb(0 0 0 / 0.08)",
        glow: "0 0 0 1px rgb(124 58 237 / 0.15), 0 8px 28px -8px rgb(124 58 237 / 0.45)",
        pop: "0 4px 0 0 rgb(0 0 0 / 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
