# Como contribuir

Há dois fluxos diferentes: contribuições de conteúdo pelo portal e alterações
técnicas pelo Git.

## Captions

Abra a página do herói, persona ou narrador, entre com Steam e use **Sugerir
alteração** na própria linha. Preserve intenção, humor e duração aproximada da
fala, além dos nomes oficiais de heróis e itens mostrados pela interface.

A sugestão é armazenada com a autoria Steam. Não é necessário abrir issue ou
pull request para esse fluxo.

## Packs de voz

1. Escolha o herói na página de envio.
2. Baixe o kit ZIP e use o checklist de falas verbais.
3. Grave um WAV por ID, mantendo um único intérprete para o pack inteiro.
4. Compartilhe a pasta do Google Drive como leitora.
5. Entre com Steam e envie o link, crédito e observações pelo formulário.

Diretrizes:

- WAV PCM mono, 16-bit, 24 ou 48 kHz;
- até 20 segundos e 10 MB por arquivo;
- nome idêntico ao ID indicado no checklist;
- sem música, clipping ou redução de ruído agressiva;
- voz própria ou autorização documentada;
- consentimento para crédito e licença CC BY 4.0.

Não envie WAVs pelo Git. Áudio extraído do jogo, material sem licença ou
imitação vocal sem consentimento não é aceito.

## Código, catálogos e documentação

Antes de abrir um pull request:

```powershell
npm install --prefix web
npm run check
```

Descreva o escopo, os IDs afetados, a origem dos dados e como a mudança foi
testada. Não versione segredos Steam, arquivos do jogo, MP3s, WAVs ou conteúdo
de `build/`.
