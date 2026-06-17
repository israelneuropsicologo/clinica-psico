Com base no vídeo, aqui está a descrição detalhada do que acontece:

**Qual aba está sendo preenchida:**
O problema ocorre dentro do perfil de uma paciente (Dulce Maria), na aba **"Prontuário"**, especificamente ao abrir a janela **"Editar Prontuário"** e tentar preencher os campos da sub-aba **"Sessão"**.

**Como os dados desaparecem:**
O usuário tenta preencher três campos específicos na aba "Sessão", e todos apresentam o mesmo comportamento de falha ao salvar:

1.  **Data da Sessão:** O usuário clica no campo, abre o calendário e seleciona o dia "19 de jun. de 2026". A data aparece no campo. Em seguida, ele clica no botão azul "Salvar" no canto superior direito. O botão muda brevemente para "Salvando...", mas logo em seguida o campo da data é limpo, voltando ao estado vazio ("dd / mm / yyyy").
2.  **Duração (min):** O usuário digita o valor "50" no campo. Ao tentar prosseguir ou interagir com a página, o valor digitado simplesmente desaparece, deixando o campo em branco.
3.  **Hora de Início:** O usuário clica no campo, utiliza o seletor de relógio para definir a hora como "01:13" e clica em "OK". A hora aparece no campo. Novamente, ele clica no botão "Salvar". O botão indica "Salvando...", mas a hora desaparece imediatamente, e o campo volta ao estado vazio ("-- : --").

**Erros ou mensagens:**
*   **Não há mensagens de erro explícitas** (como pop-ups ou textos em vermelho avisando sobre falha no sistema).
*   A única indicação visual de que algo deu errado, além do desaparecimento dos dados, é um aviso em texto vermelho escrito **"Não salvo"** que aparece ao lado do botão "Preencher com IA" logo após a tentativa falha de salvar a data da sessão. O sistema tenta salvar (mostra "Salvando..."), falha silenciosamente, limpa os campos e indica que as alterações não foram salvas.