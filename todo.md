# E-Saúde | Gestão Clínica — TODO

## Fase 1: Schema do Banco de Dados
- [x] Tabela `patients` (pacientes com campos completos)
- [x] Tabela `sessions` (sessões/agendamentos com status)
- [x] Tabela `clinical_notes` (prontuários/anotações por sessão)
- [x] Tabela `transactions` (pagamentos e transações financeiras)
- [x] Tabela `patient_documents` (documentos/laudos/PDFs por paciente)
- [x] Migração e aplicação do schema no banco

## Fase 2: Backend — DB Helpers e Routers tRPC
- [x] Helpers de DB para pacientes (CRUD)
- [x] Helpers de DB para sessões (CRUD + filtros)
- [x] Helpers de DB para prontuários/anotações
- [x] Helpers de DB para transações financeiras
- [x] Helpers de DB para documentos
- [x] Router tRPC: patients (list, create, update, delete, getById)
- [x] Router tRPC: sessions (list, create, update, delete, getById, upcoming)
- [x] Router tRPC: clinicalNotes (list, create, update, getBySession, analyzeWithAI)
- [x] Router tRPC: transactions (list, create, update, summary)
- [x] Router tRPC: financial (list, summary, create com período)
- [x] Router tRPC: documents (upload, list, delete)
- [x] Router tRPC: dashboard (metrics)
- [x] Controle de acesso por papel (user/admin) com adminProcedure

## Fase 3: Design System e Layout
- [x] Paleta de cores azul e verde-água no index.css (modo claro e escuro)
- [x] ThemeProvider com suporte a alternância claro/escuro
- [x] DashboardLayout com sidebar de navegação fixa
- [x] Rotas configuradas em App.tsx (dashboard, pacientes, sessões, financeiro, agenda)
- [x] Componente de toggle de tema no header e sidebar

## Fase 4: Dashboard
- [x] Card de total de pacientes ativos
- [x] Card de sessões do mês
- [x] Card de receita mensal
- [x] Card de inadimplência
- [x] Lista de próximas consultas
- [x] Gráficos de sessões e receita (recharts)

## Fase 5: Módulo de Pacientes
- [x] Listagem de pacientes com busca e filtros
- [x] Formulário de cadastro/edição de paciente (nome, contato, nascimento, histórico)
- [x] Página de perfil do paciente com histórico de sessões
- [x] Upload e listagem de documentos/laudos por paciente (S3)
- [x] Exclusão de paciente com confirmação

## Fase 6: Módulo de Sessões e Prontuários
- [x] Listagem de sessões com filtros de status e data
- [x] Formulário de agendamento de sessão
- [x] Editor de anotações clínicas rich text (Tiptap)
- [x] Botão "Analisar com IA" integrado ao prontuário
- [x] Painel de assistente IA (sugestões, resumo, análise de evolução)
- [x] Atualização de status da sessão (confirmada, cancelada, realizada)
- [x] Controle de pagamento por sessão (pendente/pago/isento)

## Fase 7: Módulo Financeiro
- [x] Listagem de transações com filtro por período (semana/mês/trimestre/ano)
- [x] Registro de transação (receita/despesa) com categoria
- [x] Indicador de inadimplência (sessões concluídas sem pagamento)
- [x] Resumo de receitas por mês (cards e gráficos recharts)
- [x] Gráfico de pizza por categoria

## Fase 8: Agenda e Calendário
- [x] Visualização mensal do calendário
- [x] Visualização semanal do calendário
- [x] Indicação de status por cor (confirmada=verde, cancelada=vermelho, etc.)
- [x] Clique em sessão para ver detalhes

## Fase 9: Notificações e Testes
- [x] Notificação ao proprietário ao agendar sessão
- [x] Notificação ao proprietário ao cancelar sessão
- [x] Notificação ao proprietário para pagamentos em atraso
- [x] Testes Vitest: auth.logout
- [x] Testes Vitest: patients router (list, getById, create, update, delete)
- [x] Testes Vitest: sessions router (list, create, cancel + notificação)
- [x] Testes Vitest: clinicalNotes router (create, analyzeWithAI)
- [x] Testes Vitest: dashboard router (metrics)
- [x] 15 testes passando

## Fase 10: Revisão Final
- [x] Zero erros TypeScript
- [x] Responsividade mobile com DashboardLayout
- [x] Modo claro/escuro funcionando em todas as páginas
- [x] Status badges com cores corretas para todos os estados
- [x] Checkpoint final e entrega


## Fase 11: Exportador de Relatórios (PDF/Excel Abrangente)
- [x] Router tRPC: reports com procedures para exportar sessões, prontuários, financeiro e documentação
- [x] exportSessionsCSV/JSON (todas as sessões com detalhes)
- [x] exportFinancialCSV/JSON (transações detalhadas por período)
- [x] exportProntuarioJSON (prontuário completo de um paciente com histórico)
- [x] exportPatientDocumentationJSON (documentação completa do paciente)
- [x] Componente ExportButton com dropdown para CSV/JSON
- [x] Botão "Exportar" em Sessões (com filtros de status)
- [x] Botão "Exportar" em Financeiro (com período selecionado)
- [x] Suporte para download automático de arquivos
- [x] Toast de feedback ao usuário

## Fase 12: Painel de Configurações/Admin
- [x] Tabela `settings` no schema (clinicName, ownerName, CRP, etc)
- [x] Router tRPC: settings (getSettings, updateSettings)
- [x] Página de Configurações com 3 abas (Clínica, Proprietário, Sistema)
- [x] Formulário para editar dados da clínica
- [x] Formulário para editar dados do proprietário/psicólogo
- [x] Configurações de sessão (duração, preço padrão)
- [x] Preferências regionais (idioma, moeda, fuso horário)
- [x] Rota /settings no App.tsx
- [x] Item "Configurações" no menu lateral do DashboardLayout
- [x] Testes Vitest para settings


- [x] Página Settings com formulário de configuração
- [x] Campos: Nome da clínica, email, telefone, endereço, informações do proprietário
- [x] Sincronização de formulário com dados carregados
- [x] Notificação ao salvar configurações
- [x] Testes Vitest para settings router


## Fase 13: Integração Server-to-Server com Site Mãe (psicologo.manus.space)

### Arquitetura de Webhooks e Endpoints
- [ ] Criar tabela `webhook_logs` para registrar todas as sincronizações
- [ ] Criar tabela `api_tokens` para armazenar Bearer Tokens de autenticação
- [ ] Implementar middleware de autenticação com Bearer Token
- [ ] Criar endpoint POST `/api/webhooks/sync/patient` para receber novos pacientes
- [ ] Criar endpoint POST `/api/webhooks/sync/appointment` para receber agendamentos
- [ ] Criar endpoint POST `/api/webhooks/sync/payment` para receber confirmações de pagamento
- [ ] Criar endpoint GET `/api/webhooks/validate/customer/:id` para validação cruzada

### Lógica de Sincronização de Pacientes
- [ ] Receber POST com customer_id, nome, email, telefone, data_nascimento
- [ ] Validar se customer_id já existe (GET /validate/customer/:id)
- [ ] Se não existe: criar novo paciente com status "ativo"
- [ ] Se existe: atualizar dados do paciente (merge inteligente)
- [ ] Registrar log de sincronização com timestamp

### Lógica de Sincronização de Agendamentos
- [ ] Receber POST com appointment_date (ISO 8601), customer_id, service_type
- [ ] Validar se customer_id existe no sistema
- [ ] Validar payment_status antes de criar sessão
- [ ] Somente criar sessão se payment_status === "approved"
- [ ] Atualizar status para "confirmada" automaticamente
- [ ] Sincronizar com Google Calendar se vinculado

### Lógica de Sincronização de Pagamentos
- [ ] Receber POST com transaction_id, customer_id, amount, payment_status
- [ ] Validar transaction_id para evitar duplicatas
- [ ] Atualizar status da sessão para "paga" se payment_status === "approved"
- [ ] Registrar transação no módulo financeiro
- [ ] Atualizar status de inadimplência automaticamente

### Routers tRPC para Integração
- [ ] Router `webhooks.sync` com procedures para cada tipo de sincronização
- [ ] Router `webhooks.validate` com procedures de validação cruzada
- [ ] Router `webhooks.logs` para visualizar histórico de sincronizações
- [ ] Router `webhooks.status` para verificar status da integração

### Painel de Sincronização
- [ ] Criar página `/sync-status` com dashboard de sincronizações
- [ ] Mostrar último sync, status, erros e logs
- [ ] Botão "Sincronizar Agora" para forçar sincronização manual
- [ ] Gráfico de sincronizações por hora/dia
- [ ] Alertas para falhas de sincronização

### Segurança e Validação
- [ ] Implementar rate limiting para endpoints de webhook
- [ ] Validar assinatura HMAC dos webhooks (se aplicável)
- [ ] Criptografar dados sensíveis (CPF, CRP) em trânsito
- [ ] Implementar retry automático para falhas de rede
- [ ] Logging de todas as operações para auditoria LGPD

### Testes Vitest
- [ ] Testes para validação cruzada de customer_id
- [ ] Testes para sincronização de pacientes
- [ ] Testes para sincronização de agendamentos com validação de pagamento
- [ ] Testes para sincronização de transações
- [ ] Testes para tratamento de erros e retry
