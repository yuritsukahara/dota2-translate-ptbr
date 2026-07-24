# Como contribuir

Obrigado por ajudar a construir uma dublagem brasileira comunitária, respeitosa e tecnicamente sustentável.

## 1. Escolha um lote

Abra ou assuma uma issue de herói. Para o Axe, escolha uma categoria do manifesto, como `move`, `attack` ou `ability_berserk`. Evite editar as mesmas linhas de outro PR.

## 2. Tradução

Edite `pt_br` e mude `status` de `placeholder` para `translated`.

Critérios:

- preserve intenção, humor, função de gameplay e duração aproximada;
- prefira português brasileiro oral e natural;
- mantenha nomes oficiais já localizados no cliente;
- documente trocadilhos e alternativas em `notes`;
- não copie traduções de terceiros sem licença;
- não inclua em massa o roteiro original em inglês no repositório.

Uma segunda pessoa deve revisar sentido, consistência e duração antes da gravação.

## 3. Gravação

Coloque o WAV em:

```text
audio/recordings/<heroi>/<id>.wav
```

Exemplo:

```text
audio/recordings/axe/axe_move_01.wav
```

Especificação mínima:

- WAV PCM, 16-bit;
- mono;
- 24 kHz ou 48 kHz;
- pico máximo recomendado entre -6 dBFS e -3 dBFS;
- sem clipping, redução de ruído agressiva, música ou efeitos;
- silêncio curto no começo e no fim;
- nome idêntico ao `id` do CSV.

Preencha `actor`, `license` e mude `status` para `recorded`. Depois da revisão técnica e artística, um mantenedor muda para `reviewed`.

Ao enviar uma gravação, você declara que:

1. é a pessoa gravada ou possui autorização escrita dela;
2. tem direito de publicar a interpretação;
3. aceita licenciá-la conforme a coluna `license`;
4. permite edição técnica, distribuição e uso no projeto;
5. não está imitando deliberadamente uma pessoa real sem consentimento.

Voz sintética só pode ser enviada quando o modelo, o dataset e a pessoa representada permitem esse uso de forma documentada. Clonagem ou imitação do ator original não será aceita.

## 4. Teste

```powershell
npm run validate
.\scripts\generate-test-voices.ps1 -Only "axe_move_*"
.\scripts\install-test-addon.ps1
```

O comando de geração cria guias TTS, não masters finais. Para escutar uma gravação final no addon, copie o WAV aprovado para o mesmo caminho relativo dentro de `build/content/dota2_translate_ptbr/sounds/vo/<heroi>/` antes de instalar.

## 5. Pull request

Explique:

- quais IDs mudaram;
- quem traduziu, revisou e interpretou;
- como o áudio foi capturado;
- qual licença foi concedida;
- como o lote foi testado.

PRs que incluam áudio original do Dota 2, material sem licença ou imitação vocal não autorizada serão fechados.

