/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#10b981", // Emerald green as primary accent
                secondary: "#ef4444", // Red for missed/alerts
                "background-light": "#f3f4f6",
                "background-dark": "#000000", // True Black
                "surface-light": "#ffffff",
                "surface-dark": "#0f0f0f", // Very deep grey for cards
                "surface-dark-glass": "rgba(30, 30, 30, 0.4)", // Glassmorphism
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'glow': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
                'glow-red': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
            }
        },
    },
    plugins: [],
}
