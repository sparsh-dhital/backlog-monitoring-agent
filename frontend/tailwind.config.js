/** @type {import('tailwindcss').Config} */

// Theme-aware palette. The utilities the UI uses for surfaces, ink and borders
// resolve to RGB channels declared in src/styles/tokens.css, so components
// follow light/dark mode without per-class overrides. Light values equal
// Tailwind's defaults; only the utility families listed here are themed.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const themed = (kind, spec) =>
  Object.fromEntries(
    Object.entries(spec).map(([color, steps]) => [
      color,
      steps === null
        ? token(`${kind}-${color}`)
        : Object.fromEntries(
            steps.map((step) => [step, token(`${kind}-${color}-${step}`)]),
          ),
    ]),
  );

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundColor: themed("bg", {
        white: null,
        slate: [50, 100, 200],
        indigo: [50, 100, 200],
        emerald: [50, 100],
        amber: [50, 100],
        rose: [50, 100],
        violet: [100],
        blue: [100],
      }),
      textColor: themed("text", {
        slate: [300, 400, 500, 600, 700, 800, 900],
        indigo: [400, 500, 600, 700, 900],
        emerald: [600, 700, 800],
        amber: [600, 700, 800],
        rose: [500, 600, 700],
        violet: [700],
        blue: [700],
        red: [700],
      }),
      borderColor: themed("border", {
        white: null,
        slate: [100, 200],
        indigo: [100, 200, 300],
        emerald: [100, 200],
        amber: [200],
        rose: [100, 200],
      }),
      divideColor: themed("border", { slate: [100] }),
      ringColor: themed("ring", { white: null, indigo: [100] }),
      placeholderColor: themed("text", { slate: [400] }),
      gradientColorStops: themed("stop", {
        indigo: [50],
        slate: [50],
        fuchsia: [50],
        emerald: [600],
        teal: [500],
        amber: [600],
        orange: [500],
        rose: [600],
        red: [500],
      }),
      boxShadowColor: themed("shadow", { indigo: [200] }),
    },
  },
  plugins: [],
};
