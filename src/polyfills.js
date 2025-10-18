// // src/polyfills.js
// if (typeof global === 'undefined') {
//   // map 'global' (Node) sang 'window' (browser)
//   // một số lib chỉ cần vậy là đủ
//   // eslint-disable-next-line no-undef
//   window.global = window
// }

// // một số package còn đọc process.env (không bắt buộc)
// // eslint-disable-next-line no-undef
// if (typeof window.process === 'undefined') {
//   // chỉ tạo object trống để tránh crash
//   // eslint-disable-next-line no-undef
//   window.process = { env: {} }
// }


// src/polyfills.js
if (typeof window !== 'undefined') {
  // Map 'global' (Node) sang 'window' (browser)
  window.global = window;

  // Dummy process.env để tránh crash (nếu lib đọc nó)
  if (typeof window.process === 'undefined') {
    window.process = { env: {} };
  }

  // Polyfill cho Text constructor (fix Chakra UI v3/Ark UI bug)
  if (!window.Text) {
    window.Text = function Text(textContent) {
      // Tạo text node an toàn, tương đương new Text(textContent)
      return document.createTextNode(textContent);
    };
    // Đảm bảo gọi như constructor
    window.Text.prototype = document.createTextNode('').constructor.prototype;
  }

  // Polyfill cho DocumentFragment nếu cần (bonus, tránh lỗi tương tự)
  if (!window.DocumentFragment) {
    window.DocumentFragment = function() {
      return document.createDocumentFragment();
    };
  }

}