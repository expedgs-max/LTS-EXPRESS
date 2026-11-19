import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primer: "#18181b",
        second: "#0f0f11",
        third: "#E30613",
        fourth: "#A8050D",
        fifth: "#f4f4f5",
        six: "#fafafa",
        seven: "#e4e4e7",
        gold1: '#BF953F',
        gold2: '#FCF6BA',
        gold3: '#B38728',
        gold4: '#FBF5B7',
        gold5: '#AA771C',
        gold6: '#d6ab54',
      },
      maxWidth: {
        "8xl": "85rem",
      },
      animation: {
        'progress': 'animate-progress 2s linear infinite', // Custom animation name
      },
      keyframes: {
        'animate-progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
      addUtilities({
        '.no-arrows': {
          '-webkit-appearance': 'none', /* Chrome, Safari */
          '-moz-appearance': 'textfield', /* Firefox */
          'appearance': 'textfield', /* General */
        },
      });
    },
  ],
} satisfies Config;
