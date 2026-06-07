# Configuração do ChatBot Amanda - Integração Permanente

## 🎯 Objetivo
Integrar o ChatBot Amanda com o sistema de clínica para que agendamentos apareçam automaticamente em "Agendamentos Diretos" e pacientes apareçam na lista.

## ✅ Token Permanente Gerado
- **Token:** `sk_txl9tplq8go4z2awfemx`
- **Nome:** ChatBot Amanda - Permanent
- **Status:** Ativo (sem expiração)

## 🔗 Endpoint para Enviar Agendamentos

### URL
```
POST https://sistemaclinicaapp.manus.space/api/trpc/webhooks.syncChatbotAppointment
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "customer_id": "id_unico_do_cliente",
  "customer_name": "Nome do Cliente",
  "customer_email": "email@exemplo.com",
  "customer_phone": "11987654321",
  "appointment_date": "2026-06-10",
  "appointment_time": "14:00",
  "session_type": "presencial",
  "service_type": "consultation",
  "notes": "Observações opcionais",
  "token": "sk_txl9tplq8go4z2awfemx"
}
```

### Campos Obrigatórios
- `customer_id` - ID único do cliente no ChatBot
- `customer_name` - Nome completo (mín. 3 caracteres)
- `customer_email` - Email válido
- `customer_phone` - Telefone com DDD (10-11 dígitos)
- `appointment_date` - Data em formato ISO (YYYY-MM-DD)
- `appointment_time` - Hora em formato HH:mm
- `token` - Token permanente fornecido

### Campos Opcionais
- `session_type` - "presencial" ou "online" (padrão: presencial)
- `service_type` - Tipo de serviço (padrão: consultation)
- `notes` - Anotações sobre o agendamento

### Horários Válidos
```
09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00
```

### Dias Válidos
- Segunda a Sexta (dias úteis)
- Data deve ser no futuro

## 📋 Exemplo de Requisição (cURL)
```bash
curl -X POST \
  'https://sistemaclinicaapp.manus.space/api/trpc/webhooks.syncChatbotAppointment' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer_id": "amanda-001",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_phone": "11987654321",
    "appointment_date": "2026-06-10",
    "appointment_time": "14:00",
    "session_type": "presencial",
    "service_type": "consultation",
    "token": "sk_txl9tplq8go4z2awfemx"
  }'
```

## ✨ O que Acontece Após Envio
1. ✅ Paciente é criado automaticamente (se não existe)
2. ✅ Agendamento é criado com status "scheduled"
3. ✅ Aparece em "Agendamentos Diretos" do painel
4. ✅ Proprietário recebe notificação
5. ✅ Dados são sincronizados em tempo real

## 🔐 Segurança
- Token é permanente e não expira
- Validação de email, telefone e data
- Rate limit: 100 requisições por minuto
- Logs de todas as sincronizações

## 🚀 Próximos Passos
1. Amanda configura o webhook em seu sistema
2. Testa enviando um agendamento de teste
3. Valida que paciente aparece em "Pacientes"
4. Valida que agendamento aparece em "Agendamentos Diretos"
5. Pronto para usar em produção!

## 📞 Suporte
Para dúvidas ou problemas, verifique:
- Logs do servidor: `/api/esaude/status`
- Webhook logs: Painel de Integração → Logs de Webhook
