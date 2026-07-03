/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/ui/**/*.{ts,tsx}", "./src/ui/app.css"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0d10",
        panel: "#12161b",
        line: "#1d242c",
        muted: "#8892a0",
        text: "#e8edf2",
        accent: "#8ad0ff",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
};
