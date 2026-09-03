# Prago Empreendimentos

Landing page e simulador multietapas para captação de interessados em crédito, negócios financeiros e planejamento patrimonial.

## Localhost

```bash
npm install
npm run dev
```

## Produção

O Meta Pixel `2161151114746764` registra `PageView` e `Lead`. O endpoint `VITE_LEAD_API_URL` envia o mesmo evento `Lead` para a Meta Conversions API por um Cloudflare Worker, com deduplicação via `event_id`, e encaminha nome, telefone e valor ao webhook do Kairoz CRM. As credenciais externas ficam armazenadas somente como secrets criptografados do Worker.

Sem `VITE_LEAD_API_URL`, o projeto funciona em modo de demonstração: registra a simulação apenas na sessão do navegador e oferece continuidade pelo WhatsApp.

O deploy público é realizado automaticamente pelo GitHub Pages após alterações na branch `main`, no domínio `https://prago.simulead.com.br/`.
