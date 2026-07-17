# SlidePages - Painel de Controle Admin (Web)

Este é o Painel de Controle Administrativo para o sistema **SlidePages**, projetado em **React (Vite)** e conectado ao **Firebase Firestore**. Ele permite gerenciar a fila de links, configurar macros de automação (cliques simulados e esperas) e monitorar/comandar o WebView do aplicativo Android em tempo real.

---

## 🚀 Como Iniciar Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Passo 1: Instalar as dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### Passo 2: Executar o servidor de desenvolvimento
Inicie o servidor de desenvolvimento Vite local executando:
```bash
npm run dev
```
O console estará disponível em `http://localhost:3000`.

---

## ⚙️ Configuração do Firebase (.env)

O aplicativo já vem pré-configurado com as credenciais padrão do Firebase no arquivo `.env`. 

Caso deseje usar seu próprio projeto do Firebase:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative o banco de dados **Firestore** no modo de teste ou configure as regras de segurança apropriadas.
3. Edite as variáveis de ambiente no arquivo `.env` localizado na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

---

## 📂 Estrutura do Projeto

```text
SlidePages/
├── .env                  # Variáveis de ambiente com chaves Firebase
├── .env.example          # Exemplo de configuração das variáveis
├── index.html            # Ponto de entrada HTML (SEO e Fontes)
├── package.json          # Dependências do projeto (React, Firebase, Lucide)
├── vite.config.js        # Configuração do Vite.js (Porta 3000)
├── README.md             # Guia de início rápido e informações
└── src/
    ├── main.jsx          # Inicializador do React
    ├── index.css         # Estilização com Glassmorphism, Dark-mode e Animações
    ├── firebase.js       # Inicialização do SDK do Firebase
    ├── firebaseService.js# Métodos de CRUD (Links, Macros) e Listeners (Devices)
    └── App.jsx           # UI do Painel Admin (Dashboard, CRUD e Controle Remoto)
```

---

## 🔒 Regras de Segurança recomendadas para o Firestore

Para desenvolvimento inicial no plano Spark (Gratuito), você pode configurar as seguintes regras no painel do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Apenas para testes. Configure autenticação para produção.
    }
  }
}
```
