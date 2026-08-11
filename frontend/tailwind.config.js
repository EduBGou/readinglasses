/** @type {import('tailwindcss').Config} */
import { COLORS } from './constants/colors'

module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/app/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: COLORS
    }
  },
};