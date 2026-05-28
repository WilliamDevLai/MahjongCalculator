import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 新增這行，前後都要有斜線，名稱必須和 GitHub 專案名稱完全一致！
  base: '/MahjongCalculator/' 
})