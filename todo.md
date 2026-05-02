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
- [x] Criar tabela `webhook_logs` para registrar todas as sincronizações
- [x] Criar tabela `api_tokens` para armazenar Bearer Tokens de autenticação
- [x] Implementar middleware de autenticação com Bearer Token
- [x] Criar router tRPC `webhooks.syncPatient` para receber novos pacientes
- [x] Criar router tRPC `webhooks.syncAppointment` para receber agendamentos
- [x] Criar router tRPC `webhooks.syncPayment` para receber confirmações de pagamento
- [x] Criar router tRPC `webhooks.validateCustomer` para validação cruzada

### Lógica de Sincronização de Pacientes
- [x] Receber POST com customer_id, nome, email, telefone, data_nascimento
- [x] Validar se customer_id já existe (checkCustomerExists)
- [x] Se não existe: criar novo paciente com status "ativo"
- [x] Se existe: atualizar dados do paciente (merge inteligente)
- [x] Registrar log de sincronização com timestamp

### Lógica de Sincronização de Agendamentos
- [x] Receber POST com appointment_date (ISO 8601), customer_id, service_type
- [x] Validar se customer_id existe no sistema
- [x] Validar payment_status antes de criar sessão
- [x] Somente criar sessão se payment_status === "approved"
- [x] Atualizar status para "confirmed" automaticamente
- [ ] Sincronizar com Google Calendar se vinculado

### Lógica de Sincronização de Pagamentos
- [x] Receber POST com transaction_id, customer_id, amount, payment_status
- [x] Validar transaction_id para evitar duplicatas
- [x] Atualizar status da sessão para "paid" se payment_status === "approved"
- [x] Registrar transação no módulo financeiro
- [x] Atualizar status de inadimplência automaticamente

### Routers tRPC para Integração
- [x] Router `webhooks.syncPatient` com procedure para sincronizar pacientes
- [x] Router `webhooks.syncAppointment` com procedure para sincronizar agendamentos
- [x] Router `webhooks.syncPayment` com procedure para sincronizar pagamentos
- [x] Router `webhooks.validateCustomer` com procedure de validação cruzada
- [x] Router `webhooks.getLogs` para visualizar histórico de sincronizações
- [x] Router `webhooks.getStatus` para verificar status da integração
- [x] Router `webhooks.generateToken` para gerar Bearer Tokens

### Painel de Sincronização
- [x] Criar página `/webhooks` com dashboard de sincronizações
- [x] Mostrar último sync, status, erros e logs
- [x] Gerador de Bearer Tokens com copy-to-clipboard
- [x] Documentação de payloads JSON
- [x] Endpoints de configuração
- [ ] Botão "Sincronizar Agora" para forçar sincronização manual
- [ ] Gráfico de sincronizações por hora/dia
- [ ] Alertas para falhas de sincronização

### Segurança e Validação
- [x] Implementar rate limiting para endpoints de webhook (100 req/min por token)
- [x] Validar assinatura HMAC dos webhooks (generateHMAC, verifyHMAC, timingSafeEqual)
- [x] Implementar retry automático para falhas de rede (backoff exponencial)
- [x] Criptografar dados sensíveis (CPF, CRP) em trânsito
- [x] Logging de todas as operações para auditoria LGPD

### Testes Vitest
- [x] Testes para validação cruzada de customer_id
- [x] Testes para sincronização de pacientes
- [x] Testes para sincronização de agendamentos com validação de pagamento
- [x] Testes para sincronização de transações
- [x] Testes para tratamento de erros e retry
- [x] Testes para criptografia (encryptCPF, decryptCPF, maskCPF)
- [x] Testes para LGPD logging (eventos, filtros, exportação)
