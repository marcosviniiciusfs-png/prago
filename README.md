# Prago Empreendimentos

Landing page e simulador multietapas para captação de interessados em crédito, negócios financeiros e planejamento patrimonial.

## Localhost

```bash
npm install
npm run dev
```

## Produção

Antes de publicar, configure `VITE_LEAD_API_URL` conforme `.env.example`. Sem a variável, o projeto funciona em modo de demonstração: registra a simulação apenas na sessão do navegador e oferece continuidade pelo Instagram.

O deploy público é realizado automaticamente pelo GitHub Pages após alterações na branch `main`, no domínio `https://prago.simulead.com.br/`.
