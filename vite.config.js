import { defineConfig } from 'vite';

export default defineConfig({
  // Đường dẫn cơ sở: 
  // Nếu Dung định up lên GitHub Pages dạng 'github.io/UET-Wayfinder/' 
  // thì sửa '/' thành '/UET-Wayfinder/'
  base: '/', 
  
  publicDir: 'public', // Nơi Dung để model .glb và texture
  
  server: {
    port: 3000,
    open: true, // Tự động mở trình duyệt khi chạy npm run dev
  },

  build: {
    outDir: 'dist', // Thư mục chứa code sau khi đóng gói để up lên host
    assetsInlineLimit: 0, // Đảm bảo các file 3D không bị biến thành base64 (gây lỗi load)
  }
});