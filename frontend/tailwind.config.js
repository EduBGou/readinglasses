/** @type {import('tailwindcss').Config} */
const { COLORS } = require('./constants/colors');

module.exports = {
  darkMode: "class",
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/app/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: COLORS
    }
  },
};