/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // [추가됨] 폰트 시스템 연결
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans KR"', 'sans-serif'],
      },
      // 1. 애니메이션 정의
      animation: {
        blob: "blob 7s infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "bounce-slow": "bounce 3s infinite",
      },
      // 2. 키프레임 정의
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
}