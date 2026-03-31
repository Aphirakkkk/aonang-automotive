import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sarabun: ["Sarabun", "sans-serif"] },
      colors: {
        brand: { 50:"#fff7ed",100:"#ffedd5",200:"#fed7aa",300:"#fdba74",400:"#fb923c",500:"#f97316",600:"#ea580c",700:"#c2410c",800:"#9a3412",900:"#7c2d12" },
        surface: { 0:"#ffffff",50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e4",300:"#d6d3d1" },
      },
      boxShadow: {
        card:  "0 1px 3px 0 rgba(0,0,0,0.08),0 1px 2px -1px rgba(0,0,0,0.06)",
        lift:  "0 4px 16px -2px rgba(234,88,12,0.18),0 2px 8px -2px rgba(0,0,0,0.08)",
        modal: "0 20px 60px -10px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
