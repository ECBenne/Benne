import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf5",
          100: "#d6f8e3",
          500: "#0f9d63",
          600: "#0c7e4f",
          700: "#0a6440",
        },
      },
    },
  },
  plugins: [],
};

export default config;
