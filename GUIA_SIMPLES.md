# 🚀 Guia Simples - Sincronizar Banco de Dados

## O Problema
- Conta 1 (israelmengo@gmail.com): vê 3 pacientes
- Conta 2 (israelneuropsicologo@gmail.com): vê 45 pacientes
- **Solução:** Vincular as contas para compartilhar os mesmos dados

## A Solução (3 Passos Fáceis)

### Passo 1: Abra o Terminal/Prompt de Comando

Windows:
- Pressione `Win + R`
- Digite `cmd` e pressione Enter

Mac/Linux:
- Abra o Terminal

### Passo 2: Navegue até a pasta do projeto

```bash
cd /home/ubuntu/clinica-psico
```

### Passo 3: Execute o script de migração

```bash
node apply-migration.mjs
```

Você verá:
```
🔄 Conectando ao banco de dados...
✅ Conectado ao banco de dados
🔄 Aplicando migração 1: externalCustomerId...
✅ Migração 1 aplicada
🔄 Aplicando migração 2: user_links...
✅ Migração 2 aplicada: tabela user_links criada

✅ Todas as migrações aplicadas com sucesso!
```

### Passo 4: Vincule as contas

```bash
node link-users.mjs --primary 1 --linked 2
```

Você verá:
```
✅ Usuários vinculados com sucesso!
```

### Passo 5: Pronto! 🎉

Agora:
- Conta 1 (israelmengo@gmail.com): vê 45 pacientes
- Conta 2 (israelneuropsicologo@gmail.com): vê 45 pacientes
- **Dados sincronizados automaticamente!**

## Problemas?

Se receber erro de conexão, verifique:
1. Você está conectado à internet?
2. O arquivo `.env` existe na pasta?
3. A DATABASE_URL está correta?

Se ainda tiver problemas, entre em contato!
