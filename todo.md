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
