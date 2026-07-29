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
5. o arquivo `subtitles_announcer_brazilian.txt` fornece os tokens normais e
   os aliases `[english]` com o mesmo texto PT-BR.

O mesmo pareamento é obrigatório para heróis, personas e variantes. Quando a
voz original continua em inglês, o cliente procura `[english]<token>` dentro
do recurso Brazilian. O arquivo de cada grupo deve conter tanto `<token>`
quanto `[english]<token>`, sempre com a mesma caption PT-BR.

Não é necessário reiniciar a Steam, editar opções de inicialização, usar
`autoexec.cfg` ou abrir o Dota por um launcher próprio.

## Incidente que não deve se repetir

A versão experimental anterior acrescentava `Mod dota_brazilian` em
`game/dota/gameinfo.gi`. As captions funcionaram, mas o cliente mostrou o aviso
de que o VAC não conseguiu verificar a segurança da máquina. A verificação de
integridade informou um arquivo divergente e restaurou o arquivo-base.

Não foi feita tentativa de contornar o VAC. A montagem pelo arquivo-base foi
abandonada.

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
- substituir recursos ingleses ou russos para ativar PT-BR.

O código mantém apenas uma rotina de migração: se encontrar o bloco legado
delimitado pelos marcadores do projeto no `gameinfo.gi`, remove exatamente
esse bloco. Instalações novas nunca acrescentam conteúdo ao arquivo-base.

## Verificação antes de publicar

Uma versão só pode ser promovida quando:

- o payload contém apenas caminhos sob `layers/*/dota_brazilian`;
- existe somente `subtitles_announcer_brazilian.txt` para o narrador;
- os 2.074 aliases `[english]` repetem as captions PT-BR correspondentes;
- todo token de herói, persona ou variante possui um alias `[english]` com
  texto idêntico no arquivo Brazilian do mesmo grupo;
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
