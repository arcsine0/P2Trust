/** @type {import('tailwindcss').Config} */
const nativewind = require("nativewind/tailwind/native")

module.exports = {
	content: ["./app/**.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [nativewind()],
}

