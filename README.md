# EasyCooking - Monorepo

Este é um monorepo contendo os projetos EasyCooking.

## Estrutura do Projeto

```
easycooking/
├── web/          # Aplicação frontend Next.js
├── backend/      # API backend (em desenvolvimento)
└── README.md     # Este arquivo
```

## Projetos

### Web (Frontend)
- **Tecnologia**: Next.js 15.5.3 com TypeScript
- **Localização**: `/web`
- **Scripts**:
  - `npm run dev` - Inicia o servidor de desenvolvimento
  - `npm run build` - Build da aplicação
  - `npm run start` - Inicia o servidor de produção
  - `npm run lint` - Executa o linter

### Backend (API)
- **Localização**: `/backend`
- **Status**: Em desenvolvimento

## Começando

### Frontend
```bash
cd web
npm install
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Tecnologias Utilizadas

- **Frontend**: Next.js, React 19, TypeScript, Tailwind CSS
- **Bibliotecas**: Lucide React, Next Auth, React Toastify
