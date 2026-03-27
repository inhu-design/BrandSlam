import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `npm run dev`만 쓸 때: 터미널 2에서 `npm run dev:vercel`로 API(기본 3000)를 띄우고, 여기 프록시로 붙습니다.
// VITE_DEV_API_PROXY=http://127.0.0.1:3001 처럼 바꿀 수 있습니다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:3000'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
