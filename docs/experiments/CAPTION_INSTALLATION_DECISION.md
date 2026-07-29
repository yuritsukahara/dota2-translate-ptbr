# Decisão de instalação das captions PT-BR

## Estado validado

Em 29 de julho de 2026, no build 6869, as captions PT-BR continuaram
funcionando após a Steam restaurar a integridade dos arquivos do Dota. A busca
de partida também permaneceu disponível.

O comportamento validado é:

1. o pacote fica somente em `game/dota_brazilian`;
2. `game/dota/gameinfo.gi` permanece igual ao arquivo distribuído pela Steam;
3. o usuário seleciona **Português (Brasil)** no menu de idioma do Dota;
4. o `Game_Language dota_*LANGUAGE*` do jogo monta `dota_brazilian`;
5. as três âncoras globais da configuração funcional (`brazilian`, `english`
   e `russian`) mantêm o mesmo conjunto inicial de 55.000 identificadores;
6. duas âncoras `killing_spree` complementam os identificadores ausentes;
7. os 126 recursos individuais permanecem Brazilian e contêm somente tokens
   normais.

O mesmo pareamento é obrigatório para heróis, personas e variantes. Cada grupo
deve conter tanto `<token>` quanto `[english]<token>`, sempre com a mesma
caption PT-BR. Esses pares ficam nas cinco âncoras globais da camada separada,
não duplicados em cada recurso individual.

Não é necessário reiniciar a Steam, editar opções de inicialização, usar
`autoexec.cfg` ou abrir o Dota por um launcher próprio.

## Incidentes que não devem se repetir

A versão experimental anterior acrescentava `Mod dota_brazilian` em
`game/dota/gameinfo.gi`. As captions funcionaram, mas o cliente mostrou o aviso
de que o VAC não conseguiu verificar a segurança da máquina. A verificação de
integridade informou um arquivo divergente e restaurou o arquivo-base.

Não foi feita tentativa de contornar o VAC. A montagem pelo arquivo-base foi
abandonada.

Na versão 6869.11, os recursos globais `_english` foram removidos porque um teste
manual parecia comprovar que somente `subtitles_announcer_brazilian.txt`
bastava. A comparação posterior mostrou que as cópias soltas haviam sido
removidas, mas `subtitles_announcer_english.txt` e
`subtitles_announcer_russian.txt` ainda estavam dentro do VPK compilado usado
naquele teste. A conclusão foi, portanto, inválida.

Sem a configuração completa de âncoras dentro da camada, nenhuma das captions
testadas foi resolvida de forma consistente pelo áudio original. A tentativa
6869.12 de criar 126 espelhos English também não reproduziu o comportamento
funcional.

A solução validada restaura byte a byte os 128 recursos da 6869.8 e acrescenta
somente duas tabelas complementares. Snapfire comprovou que alguns eventos
solicitam `[english]<token>`. Windranger e Faceless Void comprovaram a mesma
regra para Arcanas. O teste integral confirmou heróis base, personas, Arcanas
e narrador.

Antes de concluir que um arquivo foi removido, a auditoria deve verificar tanto
os arquivos soltos quanto o índice e os dados do VPK.

## Limites do instalador

O único destino permanente permitido é:

```text
game/dota_brazilian/
```

O instalador não pode escrever em:

```text
game/dota/gameinfo.gi
game/dota/pak01_dir.vpk
game/dota/cfg/autoexec.cfg
game/bin/**/*
```

Também não pode:

- editar executáveis ou DLLs;
- injetar código;
- gravar opções de inicialização da Steam;
- usar `-override_vpk`;
- substituir recursos ingleses ou russos dentro de `game/dota`.

Recursos com sufixos `_english` ou `_russian` dentro de
`game/dota_brazilian` pertencem à camada brasileira e não alteram os recursos
da Valve em `game/dota`.

O código mantém apenas uma rotina de migração: se encontrar o bloco legado
delimitado pelos marcadores do projeto no `gameinfo.gi`, remove exatamente
esse bloco. Instalações novas nunca acrescentam conteúdo ao arquivo-base.

## Verificação antes de publicar

Uma versão só pode ser promovida quando:

- o payload contém apenas caminhos sob `layers/*/dota_brazilian`;
- o VPK contém exatamente 130 recursos de captions: os 128 da configuração
  funcional e duas âncoras complementares;
- existem as âncoras globais Brazilian, English e Russian, além das âncoras
  `killing_spree` Brazilian e English;
- os 126 arquivos individuais são Brazilian e não contêm aliases;
- os 2.074 aliases `[english]` repetem as captions PT-BR correspondentes;
- todo token de herói, persona ou variante possui um alias `[english]` com
  texto idêntico nas âncoras globais;
- a união das âncoras possui 77.594 tokens normais e 77.594 aliases, sem
  ausências ou textos divergentes;
- cada âncora contém no máximo 55.000 identificadores. Esse número é uma
  margem conservadora do projeto, não um limite oficial documentado pela
  Valve;
- a auditoria dos recursos descompilados liga as 75.520 falas de heróis e
  variantes ao evento e ao arquivo de áudio corretos;
- os testes confirmam que a camada está completa sem montagem no
  `gameinfo.gi` base;
- o hash SHA-256 do payload e de cada arquivo interno confere;
- o Dota abre com **Português (Brasil)** selecionado, mostra a caption do
  narrador e permite buscar partida sem o aviso de verificação do VAC.

Se uma atualização do Dota quebrar a montagem nativa, a versão deve ser
pausada. Não se deve voltar a editar arquivos-base como correção rápida.

## Recuperação

Se uma instalação antiga ainda tiver a montagem legada:

1. feche o Dota;
2. use **Restaurar** no instalador atualizado;
3. na Steam, abra **Propriedades > Arquivos instalados > Verificar integridade**;
4. reinstale a camada atual;
5. selecione **Português (Brasil)** no menu do Dota.

O suporte oficial da Steam recomenda remover modificações de arquivos do jogo
e verificar a integridade quando o VAC não consegue validar a máquina:
<https://help.steampowered.com/en/faqs/view/22C0-03D0-AE4B-04E8>.
