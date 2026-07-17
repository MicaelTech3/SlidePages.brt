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

// Script para copiar o banner da TV Box automaticamente para o projeto Android
try {
  const tvSourcePath = 'C:/Users/micael/.gemini/antigravity/brain/8245bbe8-37fd-4bb8-b5b5-46375d6b76fe/tv_banner_1784257137415.png';
  const tvDestPath = 'C:/Users/micael/AndroidStudioProjects/slidepages/app/src/main/res/drawable/tv_banner.png';
  
  if (fs.existsSync(tvSourcePath)) {
    fs.copyFileSync(tvSourcePath, tvDestPath);
    console.log('Banner da TV copiado com sucesso para:', tvDestPath);
  } else {
    console.warn('Arquivo fonte do banner da TV não encontrado em:', tvSourcePath);
  }
} catch (err) {
  console.error('Erro ao copiar o banner da TV:', err);
}

// Script para copiar o APK automaticamente para o diretório public
try {
  const apkSource = path.resolve('slidepages.apk');
  const publicDir = path.resolve('public');
  const apkDest = path.join(publicDir, 'slidepages.apk');
  
  if (fs.existsSync(apkSource)) {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.copyFileSync(apkSource, apkDest);
    console.log('APK copiado com sucesso para:', apkDest);
  } else {
    console.warn('APK fonte não encontrado em:', apkSource);
  }
} catch (err) {
  console.error('Erro ao copiar o APK:', err);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.apk', '**/android/**', '**/app-debug.apk']
    }
  }
})
