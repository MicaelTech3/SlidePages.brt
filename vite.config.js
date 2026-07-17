import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Script para copiar o logo automaticamente do diretório da conversa
try {
  const sourcePath = 'C:/Users/micael/.gemini/antigravity/brain/d861897f-cf47-4f1c-b533-037ceaaa9dec/media__1784249347809.png';
  const destDir = path.resolve('src');
  const destPath = path.join(destDir, 'logo.png');
  
  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, destPath);
    console.log('Logo copiado com sucesso para:', destPath);
  } else {
    console.warn('Arquivo fonte do logo não encontrado em:', sourcePath);
  }
} catch (err) {
  console.error('Erro ao copiar o logo:', err);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
