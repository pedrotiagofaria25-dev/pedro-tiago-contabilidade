# 🛡️ AUTOMATION-PROTECTION - PEDRO TIAGO CONTABILIDADE

## 🎯 ESTRATÉGIA DE PROTEÇÃO PARA AUTOMAÇÕES

### 📊 ARQUITETURA DE SUBDOMÍNIOS:

```
www.pedrotiagocontabilidade.com.br     → Cloudflare ATIVO (usuários finais)
api.pedrotiagocontabilidade.com.br     → DIRETO GitHub Pages (Claude Code)
automation.pedrotiagocontabilidade.com.br → DIRETO GitHub Pages (MANUS/IAs)
dev.pedrotiagocontabilidade.com.br     → DIRETO GitHub Pages (desenvolvimento)
```

## 🔧 CONFIGURAÇÕES OBRIGATÓRIAS PARA CLOUDFLARE:

### ✅ SE USAR CLOUDFLARE NO DOMÍNIO PRINCIPAL:

#### Page Rules (Regras de Página):
```
URL: *api.pedrotiagocontabilidade.com.br*
- Cache Level: Bypass
- Security Level: Essentially Off
- Browser Integrity Check: Off

URL: *automation.pedrotiagocontabilidade.com.br*
- Cache Level: Bypass
- Security Level: Essentially Off
- Browser Integrity Check: Off
```

#### Firewall Rules (Regras de Firewall):
```
Campo: User Agent
Operador: contains
Valor: "Claude|Manus|OpenAI|GPT|AI|Bot|Automation|python|curl"
Ação: Allow
Prioridade: 1 (mais alta)
```

#### Bot Management:
```
- Bot Fight Mode: DISABLED
- Super Bot Fight Mode: Allow
- Challenge Passage: 30+ minutes
```

## 🔑 HEADERS DE IDENTIFICAÇÃO AUTORIZADOS:

```json
{
  "X-Automation-Key": "pedro-tiago-authorized-2025",
  "X-Client-Type": "claude-ai|manus-ai|automation",
  "X-Domain-Bypass": "true",
  "User-Agent": "PedroTiago-Automation/1.0 (Claude|Manus|AI)"
}
```

## 🌐 IPs E USER-AGENTS SEMPRE PERMITIDOS:

### User-Agents Whitelist:
- `Claude`
- `Manus`
- `OpenAI`
- `ChatGPT`
- `AI`
- `Bot`
- `Automation`
- `PedroTiago-Automation`
- `python-requests`
- `curl`

### IPs Autorizados (quando disponíveis):
- Claude AI IPs
- OpenAI IPs
- GitHub Actions IPs
- Localhost: 127.0.0.1, ::1

## 🚫 NUNCA BLOQUEAR:

### Patterns de Requests:
```
- User-Agent contendo: Claude, Manus, AI, Bot, Automation
- Headers com X-Automation-Key
- Requests para subdomínios api.* e automation.*
- GitHub Actions webhooks
- API calls com content-type application/json
```

### URLs Sempre Livres:
```
/api/*
/automation/*
/.well-known/*
/robots.txt
/sitemap.xml
```

## 🎯 URLS DE BYPASS GARANTIDAS:

### Para Claude Code:
```
1. https://api.pedrotiagocontabilidade.com.br/
2. https://pedrotiagofaria25-dev.github.io/pedro-tiago-contabilidade/
3. https://automation.pedrotiagocontabilidade.com.br/
```

### Para MANUS/Outros IAs:
```
1. https://automation.pedrotiagocontabilidade.com.br/
2. https://api.pedrotiagocontabilidade.com.br/
3. https://pedrotiagofaria25-dev.github.io/pedro-tiago-contabilidade/
```

## 📱 DETECÇÃO AUTOMÁTICA DE BLOQUEIO:

### Sinais de Bloqueio Cloudflare:
```javascript
function isCloudflareBlocked(response) {
    const indicators = [
        'cloudflare',
        'ray id',
        'checking your browser',
        'ddos protection',
        'challenge',
        'captcha'
    ];

    const text = response.toLowerCase();
    return indicators.some(indicator => text.includes(indicator));
}
```

## 🔄 PROTOCOLO DE FALLBACK AUTOMÁTICO:

### Ordem de Tentativas:
1. **URL Principal**: api.pedrotiagocontabilidade.com.br
2. **GitHub Direct**: pedrotiagofaria25-dev.github.io/pedro-tiago-contabilidade/
3. **Automation URL**: automation.pedrotiagocontabilidade.com.br
4. **Localhost/Dev**: se em desenvolvimento

### Retry Logic:
```
- Máximo 3 tentativas
- Delay: 2s, 5s, 10s
- Headers seguros em cada tentativa
- Log de falhas para debug
```

## 🛠️ IMPLEMENTAÇÃO TÉCNICA:

### DNS Configuration:
```
api.pedrotiagocontabilidade.com.br     CNAME   pedrotiagofaria25-dev.github.io
automation.pedrotiagocontabilidade.com.br CNAME   pedrotiagofaria25-dev.github.io
www.pedrotiagocontabilidade.com.br     CNAME   pedrotiagofaria25-dev.github.io (com Cloudflare)
```

### GitHub Pages Setup:
```
- Arquivo CNAME adicional para subdomínios
- Configuração de custom domains
- SSL automático para todos os subdomínios
```

## 📞 CONTATO DE EMERGÊNCIA:

Se alguma automação for bloqueada:
- **Email**: pedrotiago@pedrotiagocontabilidade.com.br
- **WhatsApp**: +55 62 99994-8445
- **GitHub Issues**: https://github.com/pedrotiagofaria25-dev/pedro-tiago-contabilidade/issues

---

**🎯 ÚLTIMA ATUALIZAÇÃO**: 2025-09-20
**👨‍💻 RESPONSÁVEL**: Pedro Tiago - CRC GO-027770/O
**🤖 APROVADO PARA**: Claude Code, MANUS AI, OpenAI, ChatGPT, Automações Personalizadas

**🚀 RESULTADO**: ZERO BLOQUEIOS + MÁXIMA PERFORMANCE + PROTEÇÃO COMPLETA