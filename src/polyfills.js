// src/polyfills.js
if (typeof global === 'undefined') {
  // map 'global' (Node) sang 'window' (browser)
  // một số lib chỉ cần vậy là đủ
  // eslint-disable-next-line no-undef
  window.global = window
}

// một số package còn đọc process.env (không bắt buộc)
// eslint-disable-next-line no-undef
if (typeof window.process === 'undefined') {
  // chỉ tạo object trống để tránh crash
  // eslint-disable-next-line no-undef
  window.process = { env: {} }
}
