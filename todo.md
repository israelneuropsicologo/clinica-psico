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

## Fase 13: Integração Server-to-Server com Site Mãe (psicologo.manus.space)

### Arquitetura de Webhooks e Endpoints
- [x] Criar tabela `webhook_logs` para registrar todas as sincronizações
- [x] Criar tabela `api_tokens` para armazenar Bearer Tokens de autenticação
- [x] Implementar middleware de autenticação com Bearer Token
- [x] Criar router tRPC `webhooks.syncPatient` para receber novos pacientes
- [x] Criar router tRPC `webhooks.syncAppointment` para receber agendamentos
- [x] Criar router tRPC `webhooks.syncPayment` para receber confirmações de pagamento
- [x] Criar router tRPC `webhooks.validateCustomer` para validação cruzada

### Lógica de Sincronização
- [x] Receber POST com customer_id, nome, email, telefone, data_nascimento
- [x] Validar se customer_id já existe (checkCustomerExists)
- [x] Se não existe: criar novo paciente com status "ativo"
- [x] Se existe: atualizar dados do paciente (merge inteligente)
- [x] Registrar log de sincronização com timestamp

### Segurança e Validação
- [x] Implementar rate limiting para endpoints de webhook (100 req/min por token)
- [x] Validar assinatura HMAC dos webhooks (generateHMAC, verifyHMAC, timingSafeEqual)
- [x] Implementar retry automático para falhas de rede (backoff exponencial)
- [x] Criptografar dados sensíveis (CPF, CRP) em trânsito
- [x] Logging de todas as operações para auditoria LGPD

### Painel de Sincronização
- [x] Criar página `/webhooks` com dashboard de sincronizações
- [x] Mostrar último sync, status, erros e logs
- [x] Gerador de Bearer Tokens com copy-to-clipboard
- [x] Documentação de payloads JSON
- [x] Endpoints de configuração
- [x] Botão "Sincronizar Agora" para forçar sincronização manual
- [x] Gráfico de sincronizações por hora/dia
- [x] Alertas para falhas de sincronização
- [x] Botão "Backoffice do Site" para redirecionar para psicologo.manus.space

### Testes Vitest
- [x] Testes para validação cruzada de customer_id
- [x] Testes para sincronização de pacientes
- [x] Testes para sincronização de agendamentos com validação de pagamento
- [x] Testes para sincronização de transações
- [x] Testes para tratamento de erros e retry
- [x] Testes para criptografia (encryptCPF, decryptCPF, maskCPF)
- [x] Testes para LGPD logging (eventos, filtros, exportação)
- [x] 36 testes passando

## Fase 14: Correções Críticas e Sincronização de Pacientes
- [x] Corrigir erro React 'removeChild' na página de webhooks (Recharts)
- [x] Implementar sincronização automática de pacientes do site
- [x] Validar que pacientes aparecem no sistema quando sincronizados
- [x] Evitar duplicatas com validação de externalCustomerId
- [x] Criptografar CPF na sincronização
- [x] Adicionar leadSource e leadStatus aos pacientes sincronizados

## Fase 15: Webhooks Públicos e Autenticação Externa
- [x] Mudar webhooks para publicProcedure (syncPatient, syncAppointment, syncPayment)
- [x] Implementar autenticação por Bearer token nos webhooks
- [x] Adicionar fallback para OAuth (chamadas internas)
- [x] Rate limiting e HMAC validation funcionando
- [x] Retry automático com backoff exponencial
- [x] 36 testes Vitest passando

## Fase 16: Endpoints tRPC para Geração de PDF
- [x] Adicionar mutations tRPC: generatePatientPDF, generateFinancialPDF
- [x] Retornar PDF em base64 para download no cliente
- [x] Suportar filtros (status, leadSource, leadStatus)
- [x] Tratamento de erros com mensagens descritivas

## Fase 17: UI Frontend para Download de PDF
- [x] Criar componente PDFExportButton com suporte a base64
- [x] Adicionar botão "Exportar PDF" em Pacientes
- [x] Adicionar botão "Exportar PDF" em Sessões
- [x] Adicionar botão "Exportar PDF" em Financeiro
- [x] Estados de carregamento e feedback com toast
- [x] Decodificação segura de base64 para download
- [x] Corrigir uso de hooks React (instanciar mutations no topo dos componentes)

## Fase 18: Testes para Endpoints de PDF
- [x] Criar suite de testes Vitest para reports router
- [x] Testar generatePatientPDF com diferentes filtros
- [x] Testar generateFinancialPDF com e sem data range
- [x] Testar exportSessions em JSON e CSV
- [x] Testar exportFinancial em JSON e CSV
- [x] Testar generateReportSummary para diferentes tipos
- [x] Validar formato base64 dos PDFs
- [x] Validar JSON e CSV gerados
- [x] 11 testes passando (47 testes totais)

## Próximas Fases (Planejadas)
- [x] Sincronização de ChatBot (leads automáticos) - webhook já implementado
- [ ] Validar integração ponta a ponta (site → clinica-psico)
- [ ] Dashboard avançado com gráficos de conversão
- [ ] Integração com Google Calendar (helper já existe)
- [ ] Notificações em tempo real via WebSocket
- [ ] Testar sincronização de ChatBot leads com teste Vitest


## 🐛 Bugs Encontrados
- [x] Erro SQL na inserção de pacientes - campos com nomes incorretos (userld, externalCustomerld) - CORRIGIDO
- [x] Erro no esbuild: "Expected '(' but found 'status'" em webhooks.ts:615 - CORRIGIDO (encoding UTF-8 no comentário)
