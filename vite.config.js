import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

function copyIndex() {
  return {
    name: 'copy-index',
    closeBundle() {
      if (!existsSync('dist')) {
        mkdirSync('dist', { recursive: true });
      }
      copyFileSync('index.html', 'dist/index.html');
    }
  };
}

export default defineConfig({
  plugins: [copyIndex()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/JustType.js'),
      name: 'JustType',
      fileName: (format) => `just-type.${format === 'umd' ? 'umd' : 'es'}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named',
        globals: {}
      }
    },
    cssCodeSplit: false
  },
  css: {
    filename: 'style.css'
  }
});
