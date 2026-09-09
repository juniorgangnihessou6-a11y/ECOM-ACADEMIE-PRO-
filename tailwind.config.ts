import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        teal: "#0FCFA4",
        brandblue: "#1E63E9",
        ink: "#10161C",
      },
      borderRadius: {
        xl2: "18px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(16, 22, 28, 0.08)",
        cardLg: "0 20px 50px rgba(16, 22, 28, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
