# ⚡ Setup Rápido - Im-Vestor Platform

**Objetivo**: Configurar o ambiente de desenvolvimento em 5 minutos.

> 📖 Para entender a arquitetura e conceitos do projeto, consulte o [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

## 🚀 Setup em 5 Minutos

### 1. Pré-requisitos
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### 2. Clone e Instale
```bash
git clone <repository-url>
cd im-vestor-full
npm install
```

### 3. Banco de Dados
```bash
# Crie o banco
createdb im-vestor-dev

# Configure no .env.local
# DATABASE_URL="postgresql://username:password@localhost:5432/im-vestor-dev"

# Aplique migrações
npm run db:push
```

### 4. Variáveis de Ambiente
Crie `.env.local` com as variáveis mínimas:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/im-vestor-dev"
DIRECT_URL="postgresql://username:password@localhost:5432/im-vestor-dev"

# Clerk (chaves de teste)
CLERK_SECRET_KEY="sk_test_..."

# Stripe (chaves de teste)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Para lista completa, veja DEVELOPER_GUIDE.md
```

### 5. Execute
```bash
npm run dev
```
Acesse: `http://localhost:3000`

## 🔧 Serviços Externos (Opcional)

Para funcionalidades completas, configure:

- **Clerk**: [Dashboard](https://dashboard.clerk.com) → Criar projeto → Copiar chaves
- **Stripe**: [Dashboard](https://dashboard.stripe.com) → Modo teste → Copiar chaves
- **Daily.co**: [Dashboard](https://dashboard.daily.co) → Criar conta → Copiar credenciais

> 📋 Para detalhes sobre variáveis de ambiente e arquitetura, veja [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

## 🐛 Problemas Comuns

```bash
# Banco não conecta
pg_ctl status
psql -h localhost -U username -d im-vestor-dev

# Dependências com problema
rm -rf node_modules package-lock.json && npm install

# Build falha
rm -rf .next && npm run build
```

## 📚 Próximos Passos

1. ✅ Projeto rodando? → Leia [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. ✅ Entendeu a arquitetura? → Consulte [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
3. ✅ Pronto para contribuir? → Faça sua primeira PR!

---

**Setup completo! 🚀**
