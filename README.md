# PDV Web Admin

## Introdução

O PDV Web Admin é o painel administrativo para o aplicativo [PDV Moderno](https.github.com/joaof-dev/pdv-moderno-mobile). Ele permite que os administradores gerenciem todos os aspectos do aplicativo móvel, desde o cadastro de produtos e clientes até a visualização de relatórios de vendas. Esta aplicação web foi desenvolvida com as tecnologias mais modernas, garantindo uma experiência de usuário fluida e eficiente.

## Funcionalidades

- **Dashboard:** Uma visão geral e resumida de todo o sistema, com estatísticas rápidas e insights sobre as vendas.
- **Gerenciamento de Produtos:** Crie, edite e exclua produtos, defina preços, controle o estoque e categorize os itens.
- **Gerenciamento de Clientes:** Mantenha um registro de todos os seus clientes, com informações de contato e histórico de compras.
- **Registro de Vendas:** Acompanhe todas as vendas realizadas no aplicativo móvel em tempo real.
- **Autenticação Segura:** Sistema de login e gerenciamento de sessão para garantir que apenas pessoal autorizado tenha acesso ao painel.
- **Design Responsivo:** A interface se adapta a diferentes tamanhos de tela, permitindo o gerenciamento a partir de desktops, tablets ou smartphones.

## Tecnologias Utilizadas

- **[Next.js](https://nextjs.org/):** Framework React para renderização no lado do servidor (SSR) e geração de sites estáticos (SSG).
- **[TypeScript](https://www.typescriptlang.org/):** Superset de JavaScript que adiciona tipagem estática ao código.
- **[Tailwind CSS](https://tailwindcss.com/):** Framework de CSS utilitário para a criação de designs customizados de forma rápida.
- **[Supabase](https://supabase.io/):** Plataforma de backend como serviço (BaaS) que oferece banco de dados, autenticação e APIs em tempo real.
- **[React](https://reactjs.org/):** Biblioteca JavaScript para a construção de interfaces de usuário.
- **[ESLint](https://eslint.org/):** Ferramenta de linting para identificar e corrigir problemas no código JavaScript/TypeScript.

## Arquitetura do Sistema

O sistema é composto por duas partes principais: o aplicativo móvel **PDV Moderno** e o painel administrativo **PDV Web Admin**. Ambos se comunicam com o mesmo backend do Supabase, compartilhando o mesmo banco de dados e sistema de autenticação.

```
┌───────────────────┐       ┌───────────────────┐
│   PDV Moderno     │       │  PDV Web Admin    │
│ (Aplicativo Móvel)│       │      (Web)        │
└───────────────────┘       └───────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
           ┌─────────▼─────────┐
           │     Supabase      │
           │ (Backend-as-a-Service)│
           ├───────────────────┤
           │  - Banco de Dados │
           │  - Autenticação   │
           │  - APIs em Tempo Real│
           └───────────────────┘
```

## Estrutura do Banco de Dados

O banco de dados no Supabase é estruturado da seguinte forma:

- **`products`**: Armazena informações sobre os produtos, como nome, preço, quantidade em estoque, etc.
- **`customers`**: Contém os dados dos clientes, como nome, email, telefone, etc.
- **`sales`**: Registra cada venda, incluindo o cliente, os produtos vendidos, o total da venda e a data.
- **`users`**: Tabela gerenciada pelo sistema de autenticação do Supabase, contendo os usuários do sistema (administradores).

Para uma descrição detalhada de cada tabela e seus campos, consulte o arquivo `src/lib/database.types.ts`.

## Começando

Siga as instruções abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [npm](https://www.npmjs.com/)

### Instalação

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/joaof-dev/pdv-web-admin.git
    cd pdv-web-admin
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**

    Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis de ambiente, substituindo pelos seus próprios valores do Supabase:

    ```
    NEXT_PUBLIC_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
    ```

4.  **Execute o servidor de desenvolvimento:**

    ```bash
    npm run dev
    ```

    Abra [http://localhost:3000](http://localhost:3000) em seu navegador para ver a aplicação em execução.

## Estrutura do Projeto

```
pdv-web-admin/
├── .next/              # Arquivos de build do Next.js
├── node_modules/       # Dependências do projeto
├── public/             # Arquivos estáticos (imagens, fontes, etc.)
├── src/
│   ├── app/
│   │   ├── (app)/      # Rotas protegidas da aplicação
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── credits/
│   │   │   ├── customers/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── sales/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx    # Página de login
│   ├── context/
│   │   └── AuthContext.tsx # Contexto de autenticação
│   └── lib/
│       ├── database.types.ts # Tipos do banco de dados
│       └── supabase/
│           └── client.ts # Cliente Supabase
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

## Autenticação

A autenticação é gerenciada pelo Supabase Auth. A página de login (`src/app/page.tsx`) permite que os administradores entrem no sistema. Após o login, um token de sessão é armazenado no navegador, e o usuário é redirecionado para o dashboard.

O `AuthContext` (`src/context/AuthContext.tsx`) fornece informações sobre o usuário autenticado para todos os componentes da aplicação. As rotas protegidas estão localizadas no diretório `src/app/(app)/`, e o `layout.tsx` dentro desse diretório verifica se o usuário está autenticado antes de renderizar qualquer página.

## Contribuindo

Contribuições são bem-vindas! Se você tiver alguma ideia, sugestão ou encontrar algum bug, sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).