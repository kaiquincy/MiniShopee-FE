// src/theme.js (Chakra v3)
import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
  defineSlotRecipe,
} from '@chakra-ui/react'

// ===== Tokens (fonts, colors) =====
const tokensConfig = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans" },
        body:    { value: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans" },
      },
      colors: {
        brand: {
          50:  { value: '#e7f5ff' },
          100: { value: '#d0ebff' },
          200: { value: '#a5d8ff' },
          300: { value: '#74c0fc' },
          400: { value: '#4dabf7' },
          500: { value: '#228be6' },
          600: { value: '#1c7ed6' },
          700: { value: '#1971c2' },
          800: { value: '#1864ab' },
          900: { value: '#0b4f91' },
        },
      },
    },

    // ===== Global CSS (v3 dùng globalCss) =====
    globalCss: {
      'html, body, #root': { height: '100%' },
      body: { bg: 'gray.50' },
      '.glass': {
        backdropFilter: 'saturate(180%) blur(10px)',
        background: 'rgba(255,255,255,0.66)',
        boxShadow: '0 10px 30px rgba(2, 32, 71, 0.08)',
      },
      // Tùy chọn: đặt mặc định color palette toàn app là "brand"
      html: { colorPalette: 'brand' },
    },

    // ===== Recipes / Slot recipes để override component styles =====
    recipes: {
      // Button: bo góc 10px + mặc định dùng brand
      button: defineRecipe({
        baseStyle: {
          borderRadius: '10px',
          colorPalette: 'brand',
        },
      }),

      // Badge: bo góc 8px
      badge: defineRecipe({
        baseStyle: {
          borderRadius: '8px',
        },
      }),
    },

    slotRecipes: {
      // Input: bo góc cho slot "field"
      input: defineSlotRecipe({
        slots: ['root', 'field', 'element'],
        base: {
          field: { borderRadius: '10px' },
        },
      }),

      // Select: bo góc cho slot "trigger" (nút hiển thị giá trị)
      select: defineSlotRecipe({
        slots: ['root', 'trigger', 'content'],
        base: {
          trigger: { borderRadius: '10px' },
        },
      }),
    },
  },
})

// Kết hợp với defaultConfig để giữ recipe & tokens mặc định của Chakra
const system = createSystem(defaultConfig, tokensConfig)

export default system
