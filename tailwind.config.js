/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans KR"', 'sans-serif'],
      },
      // 1. 애니메이션 정의 (infinite-scroll 추가)
      animation: {
        blob: "blob 7s infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "bounce-slow": "bounce 3s infinite",
        "infinite-scroll": "infinite-scroll 40s linear infinite", // 40초 동안 선형적으로 무한 반복
      },
      // 2. 키프레임 정의 (infinite-scroll 추가)
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }, // 전체 길이의 절반(복제본 시작점)까지 이동
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".animation-delay-2000": { "animation-delay": "2s" },
        ".animation-delay-4000": { "animation-delay": "4s" },
      };
      addUtilities(newUtilities);
    },
  ],
};