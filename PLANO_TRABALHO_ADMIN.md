# 📋 PLANO DE TRABALHO - Sistema de Administração

**Objetivo:** Implementar sistema completo de administração para reduzir gasto de créditos Manus

**Data de Início:** 09/05/2026

---

## FASE 1: Gerenciamento de Usuários e Permissões ⚡ (URGENTE)

### Objetivos
- [ ] Criar interface de CRUD de usuários
- [ ] Implementar sistema de roles (admin, psicólogo, secretária, paciente)
- [ ] Gerenciar permissões por role
- [ ] Resetar senhas de usuários
- [ ] Ativar/desativar contas
- [ ] Auditoria de criação/edição de usuários

### Componentes a Criar
- `client/src/pages/AdminUsers.tsx` - Página de gerenciamento de usuários
- `client/src/components/UserForm.tsx` - Formulário de criar/editar usuário
- `client/src/components/RoleManager.tsx` - Gerenciador de roles
- `server/routers/admin-users.ts` - Procedures tRPC para usuários
- `drizzle/schema.ts` - Atualizar tabela users com roles

### Banco de Dados
- [ ] Adicionar coluna `role` em users (enum: admin, psychologist, secretary, patient)
- [ ] Adicionar coluna `isActive` em users
- [ ] Criar tabela `roles` com permissões
- [ ] Criar tabela `user_permissions` para mapeamento

### Testes
- [ ] Vitest para criar usuário
- [ ] Vitest para editar usuário
- [ ] Vitest para deletar usuário
- [ ] Vitest para gerenciar roles

---

## FASE 2: Configurações de Clínica

### Objetivos
- [ ] Painel de configurações gerais
- [ ] Nome, logo, cores da marca
- [ ] Horário de funcionamento
- [ ] Feriados e dias de folga
- [ ] Tipos de sessão customizáveis
- [ ] Valores padrão por tipo

### Componentes a Criar
- `client/src/pages/AdminSettings.tsx` - Página de configurações
- `client/src/components/ClinicSettings.tsx` - Configurações gerais
- `client/src/components/SessionTypeManager.tsx` - Gerenciador de tipos de sessão
- `server/routers/admin-settings.ts` - Procedures

### Banco de Dados
- [ ] Criar tabela `clinic_settings`
- [ ] Criar tabela `session_types`
- [ ] Criar tabela `clinic_holidays`

---

## FASE 3: Gerenciamento de Templates

### Objetivos
- [ ] Criar/editar templates de prontuário
- [ ] Criar/editar templates de anamnese
- [ ] Criar/editar templates de relatórios
- [ ] Campos customizáveis
- [ ] Versionamento de templates

### Componentes a Criar
- `client/src/pages/AdminTemplates.tsx`
- `client/src/components/TemplateEditor.tsx`
- `server/routers/admin-templates.ts`

### Banco de Dados
- [ ] Criar tabela `templates`
- [ ] Criar tabela `template_fields`
- [ ] Criar tabela `template_versions`

---

## FASE 4: Integração com Externos (Webhooks e Tokens)

### Objetivos
- [ ] Interface para gerenciar webhooks
- [ ] Testar webhooks
- [ ] Ver histórico de chamadas
- [ ] Reenviar webhooks falhados
- [ ] Gerenciar tokens de API
- [ ] Configurar rate limits

### Componentes a Criar
- `client/src/pages/AdminIntegrations.tsx`
- `client/src/components/WebhookManager.tsx`
- `client/src/components/TokenManager.tsx`
- `server/routers/admin-integrations.ts`

### Banco de Dados
- [ ] Adicionar campos em `api_tokens`
- [ ] Criar tabela `webhooks` (configuração)
- [ ] Expandir `webhook_logs`

---

## FASE 5: Automações e Agendamentos

### Objetivos
- [ ] Criar regras de automação
- [ ] Agendar tarefas recorrentes
- [ ] Configurar lembretes automáticos
- [ ] Criar workflows customizados
- [ ] Gatilhos baseados em eventos

### Componentes a Criar
- `client/src/pages/AdminAutomations.tsx`
- `client/src/components/AutomationBuilder.tsx`
- `server/routers/admin-automations.ts`

### Banco de Dados
- [ ] Criar tabela `automations`
- [ ] Criar tabela `automation_triggers`
- [ ] Criar tabela `automation_actions`

---

## FASE 6: Relatórios e Analytics Customizados

### Objetivos
- [ ] Gerar relatórios customizados (SQL puro)
- [ ] Exportar em CSV/Excel
- [ ] Criar dashboards customizados
- [ ] Agendar envio de relatórios
- [ ] Filtros avançados

### Componentes a Criar
- `client/src/pages/AdminReports.tsx`
- `client/src/components/ReportBuilder.tsx`
- `server/routers/admin-reports.ts`

### Banco de Dados
- [ ] Criar tabela `custom_reports`
- [ ] Criar tabela `report_schedules`

---

## FASE 7: Comunicação (Email, SMS, Templates)

### Objetivos
- [ ] Configurar SMTP
- [ ] Configurar SMS
- [ ] Templates de email
- [ ] Enviar mensagens em massa
- [ ] Histórico de comunicações

### Componentes a Criar
- `client/src/pages/AdminCommunication.tsx`
- `client/src/components/EmailTemplateEditor.tsx`
- `server/routers/admin-communication.ts`

### Banco de Dados
- [ ] Criar tabela `communication_templates`
- [ ] Criar tabela `communication_logs`

---

## FASE 8: Backup e Recuperação

### Objetivos
- [ ] Fazer backup manual
- [ ] Restaurar de backup
- [ ] Agendar backups automáticos
- [ ] Gerenciar retenção
- [ ] Exportar dados completos

### Componentes a Criar
- `client/src/pages/AdminBackup.tsx`
- `server/routers/admin-backup.ts`

### Banco de Dados
- [ ] Criar tabela `backups`

---

## FASE 9: Auditoria e Compliance LGPD

### Objetivos
- [ ] Ver logs de ações
- [ ] Filtrar logs
- [ ] Exportar logs
- [ ] Políticas de retenção
- [ ] LGPD: solicitar/deletar dados

### Componentes a Criar
- `client/src/pages/AdminAudit.tsx`
- `server/routers/admin-audit.ts`

### Banco de Dados
- [ ] Expandir `audit_logs`

---

## FASE 10: Gerenciamento de Dados (Importação em Massa)

### Objetivos
- [ ] Importar pacientes em massa
- [ ] Importar sessões em massa
- [ ] Limpar dados duplicados
- [ ] Validar integridade
- [ ] Corrigir inconsistências

### Componentes a Criar
- `client/src/pages/AdminDataManagement.tsx`
- `client/src/components/ImportWizard.tsx`
- `server/routers/admin-data.ts`

---

## FASE 11: Notificações e Alertas

### Objetivos
- [ ] Configurar canais de notificação
- [ ] Criar regras de alerta
- [ ] Gerenciar preferências
- [ ] Ver histórico de notificações

### Componentes a Criar
- `client/src/pages/AdminNotifications.tsx`
- `server/routers/admin-notifications.ts`

### Banco de Dados
- [ ] Criar tabela `notification_rules`
- [ ] Criar tabela `notification_preferences`

---

## FASE 12: Faturamento e Financeiro

### Objetivos
- [ ] Emitir recibos/notas fiscais
- [ ] Configurar formas de pagamento
- [ ] Registrar pagamentos manualmente
- [ ] Gerar boletos/PIX
- [ ] Relatório de fluxo de caixa

### Componentes a Criar
- `client/src/pages/AdminBilling.tsx`
- `server/routers/admin-billing.ts`

### Banco de Dados
- [ ] Criar tabela `payment_methods`
- [ ] Criar tabela `invoices`

---

## FASE 13: Integrações com Terceiros

### Objetivos
- [ ] Conectar Google Calendar
- [ ] Conectar Stripe/PagSeguro
- [ ] Conectar Typeform
- [ ] Conectar WhatsApp Business
- [ ] Conectar CRM

### Componentes a Criar
- `client/src/pages/AdminThirdParty.tsx`
- `server/routers/admin-integrations-third-party.ts`

### Banco de Dados
- [ ] Criar tabela `third_party_integrations`

---

## FASE 14: Segurança Avançada

### Objetivos
- [ ] Configurar 2FA
- [ ] Gerenciar sessões ativas
- [ ] Forçar logout remoto
- [ ] IP whitelist
- [ ] Políticas de senha

### Componentes a Criar
- `client/src/pages/AdminSecurity.tsx`
- `server/routers/admin-security.ts`

### Banco de Dados
- [ ] Criar tabela `security_policies`
- [ ] Criar tabela `active_sessions`

---

## FASE 15: Customização do Sistema

### Objetivos
- [ ] Adicionar campos customizados
- [ ] Criar tipos de documentos
- [ ] Configurar fluxos de aprovação
- [ ] Customizar interface

### Componentes a Criar
- `client/src/pages/AdminCustomization.tsx`
- `server/routers/admin-customization.ts`

### Banco de Dados
- [ ] Criar tabela `custom_fields`
- [ ] Criar tabela `document_types`

---

## 📊 RESUMO DE PROGRESSO

| Fase | Status | Prioridade |
|------|--------|-----------|
| 1. Usuários e Permissões | ⏳ Em Progresso | 🔴 Urgente |
| 2. Configurações | ⏳ Aguardando | 🔴 Alta |
| 3. Templates | ⏳ Aguardando | 🟡 Média |
| 4. Webhooks/Tokens | ⏳ Aguardando | 🔴 Alta |
| 5. Automações | ⏳ Aguardando | 🟡 Média |
| 6. Relatórios | ⏳ Aguardando | 🔴 Alta |
| 7. Comunicação | ⏳ Aguardando | 🟡 Média |
| 8. Backup | ⏳ Aguardando | 🟡 Média |
| 9. Auditoria | ⏳ Aguardando | 🟡 Média |
| 10. Importação | ⏳ Aguardando | 🟡 Média |
| 11. Notificações | ⏳ Aguardando | 🟡 Média |
| 12. Faturamento | ⏳ Aguardando | 🟡 Média |
| 13. Terceiros | ⏳ Aguardando | 🟢 Baixa |
| 14. Segurança | ⏳ Aguardando | 🟡 Média |
| 15. Customização | ⏳ Aguardando | 🟢 Baixa |

---

**Próximo Passo:** Iniciar FASE 1 - Gerenciamento de Usuários e Permissões
