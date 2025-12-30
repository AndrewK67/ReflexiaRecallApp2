/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0,0,0,.45)",
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(closest-side, rgba(34,211,238,.18), transparent 70%)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        orbit: {
          "0%,100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(180deg)" },
        },
        glow: {
          "0%,100%": { opacity: ".55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        orbit: "orbit 10s linear infinite",
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
