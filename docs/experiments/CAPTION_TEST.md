# Investigação local das captions PT-BR no Dota 2

O inventário e o pacote PT-BR estão prontos. A investigação anterior concluiu
cedo demais que existia uma etapa interna de compilação: o próprio
`client.dll` contém o molde
`resource/subtitles/subtitles_%s_%language%%s.txt`, mostrando que os arquivos
de legenda são carregados por nome em tempo de execução.

A rotina foi localizada no binário e o comportamento ficou mais preciso:

1. ela recebe o nome `game_sounds_vo_axe`;
2. remove o prefixo `game_sounds_vo_`;
3. forma `resource/subtitles/subtitles_axe_%language%.txt`;
4. em modo de staging, acrescenta `_staging` depois do idioma.

Assim, os dois caminhos possíveis para o teste do Axe são:

```text
resource/subtitles/subtitles_axe_brazilian.txt
resource/subtitles/subtitles_axe_brazilian_staging.txt
```

O instalador experimental inclui ambos. O segundo é especialmente relevante
ao testar pelo modo de demonstração do herói.

O que foi confirmado dentro do Dota:

- `Configurações > Áudio > Opções > Exibir legendas` habilita o sistema;
- captions oficiais aparecem em uma caixa escura à direita da tela;
- o announcer padrão mostra, por exemplo, “Prepare-se para a batalha”;
- o cliente monta `game/dota_brazilian`;
- o arquivo oficial inglês do Axe contém 1.050 tokens no mesmo grupo;
- 284 são da voz-base (`axe_axe_*`), 284 são da variante Automaton
  (`axe_auto_*`) e 482 são da variante Jungle (`axe_jung_*`);
- nosso primeiro pacote continha somente os 284 tokens da voz-base;
- todos os 284 tokens Automaton têm correspondência textual exata com a
  voz-base. O gerador agora inclui esses aliases automaticamente;
- o Axe usado no teste era Automaton;
- `cc_log 3` e `cc_captiontrace 1` permitem diferenciar “arquivo não
  carregado” de “token não encontrado”.

As legendas de voz catalogadas usam o formato:

```text
resource/subtitles/subtitles_{diretório}_brazilian.txt
```

Cada tradução precisa manter o token original do evento de som. Exemplo:

```text
"axe_axe_attack_02"    "Prove a minha lâmina!"
```

O gerador prioriza, nesta ordem: caption oficial da Valve, tradução comunitária
já incluída no portal e tradução automática não revisada.

## Gerar sem instalar

```powershell
# Todos os heróis e narrador
node scripts/build-local-caption-pack.mjs

# Apenas Axe
node scripts/build-local-caption-pack.mjs --hero axe
```

O resultado fica em `build/caption-pack/dota_brazilian`.

## Laboratório de instalação

O instalador usa o caminho validado no cliente normal. Feche o Dota e use:

```powershell
# Pacote completo
.\scripts\install-caption-client-test.ps1

# Ou somente o Axe
.\scripts\install-caption-client-test.ps1 -Hero axe
```

O laboratório preserva o VPK da camada `dota_brazilian`, qualquer diretório de
subtitles existente e o `boot.vcfg`. Ele não mexe em executáveis, não injeta
DLL e não altera `game/dota/pak01_dir.vpk`. Entradas já presentes no VPK de
idioma são copiadas para o pacote experimental.

No Dota, abra:

```text
Configurações > Áudio > Opções > Exibir legendas
```

Para diagnóstico de um token específico, ative o console em
`Configurações > Jogo > Diversos`, vincule uma tecla para `Console` e use:

```text
cc_emit axe_axe_attack_02
```

O primeiro teste negativo com esse token não é conclusivo: o Axe em uso tinha
uma variante de voz, enquanto o pacote só cobria `axe_axe_*`. Para testar sem
essa ambiguidade, use uma fala natural da voz-base ou Automaton e ative:

```text
cc_log 3
cc_captiontrace 1
```

Não existe etapa de compilação para captions: os arquivos
`resource/subtitles/*.txt` permanecem texto no VPK oficial. O pack do cliente
normal não depende de Workshop Tools.

## Resultado do teste com `-override_vpk`

Também foi testado o caminho loose da instalação principal:

```text
game/dota/resource/subtitles/subtitles_axe_brazilian.txt
game/dota/resource/subtitles/subtitles_axe_brazilian_staging.txt
```

O cliente foi iniciado pela Steam com `-override_vpk`, confirmado na linha de
comando do processo. No mesmo demo:

- `cc_emit axe_axe_move_01` não exibiu caption;
- `cc_emit axe_auto_axe_move_01` não exibiu caption;
- `cc_emit announcer_announcer_battle_prepare_01` exibiu
  “Prepare-se para a batalha.”.

Portanto, `-override_vpk` sozinho não substitui captions do VPK oficial nem
registra um novo arquivo de subtitles.

### Arquivo-âncora

O caminho validado usa o arquivo oficial já registrado
`subtitles_announcer_brazilian.txt` como âncora e acrescenta nele os tokens do
Axe. O arquivo combinado é incorporado ao `pak01` separado da camada
`dota_brazilian`; o `game/dota/pak01_dir.vpk` principal continua intocado.

O teste de controle alterou temporariamente a caption oficial
`announcer_announcer_battle_prepare_01` para `TESTE ANCORA EXTERNA ATIVA`.
A marca apareceu no jogo somente quando empacotada no VPK de idioma. No mesmo
mapa, `cc_emit axe_axe_move_01` exibiu “Cortar é correr!”. Isso confirma que:

- o cliente carrega a substituição a partir do VPK `dota_brazilian`;
- o dicionário de captions desse arquivo é global;
- tokens de heróis podem ser acrescentados à âncora do announcer;
- não é necessário editar o VPK principal nem compilar os arquivos `.txt`.

O instalador definitivo gera essa âncora a partir do pacote selecionado,
preserva o VPK de idioma anterior e permite restauração:

```powershell
.\scripts\install-caption-client-test.ps1 -Hero axe
.\scripts\restore-caption-client-test.ps1
```

### Pacote completo validado

O mesmo mecanismo foi ampliado para todo o catálogo. No build local testado, o
gerador produziu:

- 127 arquivos de origem;
- 48.220 entradas de caption;
- 48.212 tokens únicos no arquivo-âncora;
- 1.399 textos oficiais PT-BR;
- 4.847 textos comunitários;
- 41.974 traduções automáticas não revisadas.

Depois da instalação completa, uma fala natural do Axe exibiu sua caption em
PT-BR. Como controle fora do Axe,
`cc_emit crystalmaiden_cm_move_01` exibiu “À batalha!”. Isso confirma que o
dicionário global contém também os demais heróis.

Personas e variantes permanecem em um inventário separado da cobertura base.
A auditoria local encontrou 41 grupos relevantes, com 28.649 captions oficiais
em inglês. Destas, 28.184 puderam reutilizar uma tradução PT-BR existente por
line ID ou texto inglês já catalogado. Essas correspondências também entram
no pacote completo; as linhas exclusivas não são preenchidas automaticamente
por esse reaproveitamento.

## Restaurar

Com o Dota fechado:

```powershell
.\scripts\restore-caption-client-test.ps1
```

O diretório anterior, o VPK de idioma e o `boot.vcfg` são restaurados.
