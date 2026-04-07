# SOS Cantanhede 🚨

Aplicação mobile de reporte de ocorrências urbanas para o concelho de Cantanhede, desenvolvida em React Native com Expo.

---

## Sobre o Projeto

O SOS Cantanhede permite que qualquer cidadão, residente ou natural de Cantanhede, reporte problemas urbanos (infraestrutura, iluminação, resíduos, trânsito, ambiente) diretamente às entidades responsáveis, com geolocalização, fotografia e acompanhamento do estado em tempo real.

---

## Funcionalidades

### Cidadão
- Registo e login com persistência de sessão
- Submissão de ocorrências com título, descrição e categoria
- Localização por GPS, pin no mapa ou morada manual
- Validação geográfica — apenas aceita localizações dentro do concelho de Cantanhede
- Fotografia anexada (câmara ou galeria)
- Mapa com todas as ocorrências ativas de todos os utilizadores
- Consulta e detalhe das suas próprias ocorrências
- Perfil com nome, email e role

### Administrador
- Painel com todas as ocorrências pendentes
- Marcar ocorrências como resolvidas ou rejeitadas
- Ocorrências resolvidas/rejeitadas são removidas automaticamente do mapa

---

## Stack Tecnológica

| Tecnologia | Utilização |
|---|---|
| React Native + Expo | Framework mobile (iOS e Android) |
| TypeScript | Linguagem principal |
| Expo Router | Navegação por ficheiros |
| Firebase Authentication | Autenticação e gestão de sessão |
| Firebase Firestore | Base de dados NoSQL |
| react-native-maps | Mapa interativo (Google Maps) |
| Nominatim / OpenStreetMap | Geocoding e validação de moradas |
| AsyncStorage | Persistência local de sessão |

---

## Estrutura do Projeto
app/
├── _layout.tsx              # Navegação raiz + gestão de sessão
├── login.tsx                # Ecrã de login
├── register.tsx             # Ecrã de registo
├── new-report.tsx           # Formulário de nova ocorrência
├── admin.tsx                # Painel de administração
├── report/
│   └── [id].tsx             # Detalhe de ocorrência
└── (tabs)/
├── _layout.tsx          # Drawer lateral
├── index.tsx            # Mapa principal
├── reports.tsx          # Minhas ocorrências
└── profile.tsx          # Perfil do utilizador
lib/
├── firebase.ts              # Configuração Firebase
├── auth.ts                  # Autenticação e roles
├── reports.ts               # CRUD de ocorrências
├── location.ts              # Validação geográfica + geocoding
└── storage.ts               # Upload de imagens

---

## Instalação e Execução

### Pré-requisitos

- Node.js 18+
- Expo CLI
- Conta Firebase com Firestore e Authentication configurados
- Chave de API Google Maps

### Passos

1. Clona o repositório
```bash
git clone https://github.com/Filipe1507/sos-cantanhede.git
cd sos-cantanhede
```

2. Instala as dependências
```bash
npm install
```

3. Configura o Firebase

Edita o ficheiro `lib/firebase.ts` com as credenciais do teu projeto Firebase:
```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

4. Inicia a aplicação
```bash
npx expo start
```

---

## Configuração de Administrador

A designação de administradores é feita manualmente no Firebase Firestore:

1. Acede à consola do Firebase
2. Abre a coleção `users`
3. Encontra o documento do utilizador pretendido
4. Altera o campo `role` de `"citizen"` para `"admin"`

---

## Validação Geográfica

A aplicação utiliza um polígono geográfico aproximado dos limites do concelho de Cantanhede. Qualquer localização submetida — por GPS, pin no mapa ou morada escrita — é validada contra este polígono antes de ser aceite. Localizações fora do concelho são rejeitadas.

---

## Modelo de Dados

### Coleção `users`
| Campo | Tipo | Descrição |
|---|---|---|
| uid | String | Identificador único (Firebase Auth) |
| name | String | Nome do utilizador |
| email | String | Email do utilizador |
| role | String | `citizen` ou `admin` |
| createdAt | Timestamp | Data de registo |

### Coleção `reports`
| Campo | Tipo | Descrição |
|---|---|---|
| id | String | Identificador único |
| title | String | Título da ocorrência |
| description | String | Descrição detalhada |
| category | String | infraestrutura / iluminacao / residuos / transito / ambiente / outro |
| status | String | pending / in_review / resolved / rejected |
| userId | String | Referência ao utilizador autor |
| location.lat | Number | Latitude |
| location.lng | Number | Longitude |
| location.address | String | Morada textual |
| imageUrl | String | Imagem em base64 |
| createdAt | Timestamp | Data de submissão |
| updatedAt | Timestamp | Data da última atualização |

---

## Desenvolvido por

Filipe Ferreira e Nuno Severa
Licenciatura em Informática de Gestão  
Projeto e Desenvolvimento Informático — 2025/2026
Projeto e Desenvolvimento Informático — 2025/2026