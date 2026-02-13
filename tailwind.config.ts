import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        heading: ["var(--font-fraunces)", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "#1a1a2e",
          light: "#25254a",
          dark: "#121222",
        },
        coral: {
          DEFAULT: "#e94560",
          light: "#f06b80",
          dark: "#c7324c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
