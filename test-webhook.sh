#!/bin/bash

echo "🧪 Testando webhook de agendamento do ChatBot..."
echo ""

# Dados do agendamento
PAYLOAD=$(cat <<'EOF'
{
  "customer_id": "chatbot-amanda-001",
  "customer_name": "Amanda Silva",
  "customer_email": "amanda@example.com",
  "customer_phone": "(21) 98765-4321",
  "appointment_date": "2026-05-05",
  "appointment_time": "14:00",
  "service_type": "consultation",
  "notes": "Primeira consulta - referência do ChatBot",
  "session_type": "presencial"
}
EOF
)

echo "📋 Payload:"
echo "$PAYLOAD" | jq .
echo ""

# Fazer requisição POST para o webhook com formato tRPC correto
echo "📤 Enviando requisição para o webhook..."
echo ""

# Codificar o payload em JSON para o query parameter
ENCODED_INPUT=$(echo "$PAYLOAD" | jq -c . | jq -sRr @uri)

curl -X POST \
  "http://localhost:3000/api/trpc/webhooks.syncChatbotAppointment?input=$ENCODED_INPUT" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq .

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📌 Nota: Se receber erro de autenticação, é normal - o webhook requer token ou OAuth"
echo "   Para usar em produção, configure o ChatBot para enviar o token de API."
