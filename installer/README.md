# Instalador Windows

Aplicativo WPF em .NET 8 para localizar o Dota 2, baixar a versão estável do
GitHub, aplicar captions/vozes na camada brasileira e restaurar essa camada.

## O que a descoberta verifica

1. Lê a instalação principal da Steam no Registro do Windows.
2. Abre `steamapps/libraryfolders.vdf`.
3. Percorre todas as bibliotecas Steam configuradas.
4. Procura `steamapps/common/dota 2 beta`.
5. Valida `game/dota/pak01_dir.vpk` e `game/dota/cfg/boot.vcfg`.
6. Lê o build no `appmanifest_570.acf`, quando disponível.
7. Detecta uma instalação existente pelas vozes compiladas, captions, VPK,
   manifesto e `gameinfo.gi` próprios da camada brasileira.

Se a Steam ou o VDF não puderem ser lidos, a interface permite escolher tanto
`dota 2 beta` quanto `dota 2 beta/game/dota`. O caminho só é salvo depois de
passar pela mesma validação.

Quando a dublagem já está presente, a interface mostra o estado instalado e
troca a ação principal de **Instalar** para **Atualizar instalação**. A opção de
restauração só é liberada quando o backup correspondente também existe.

## Modos disponíveis

- **Somente legendas:** instala todas as captions PT-BR do pacote sem substituir
  vozes.
- **Legendas + voz do Axe:** instala as mesmas captions e o pack-exemplo com
  243 falas compiladas.

O usuário escolhe o modo dentro do instalador.

## Segurança atual

- A simples abertura, busca e seleção de pasta são somente leitura.
- O app bloqueia ações enquanto `dota2.exe` estiver aberto.
- O executável baixa o pacote do canal estável no GitHub apenas quando
  necessário.
- O ZIP e cada arquivo interno são verificados por SHA-256.
- Não lê nem altera as opções de inicialização do Dota na Steam.
- Não depende de `autoexec.cfg`; uma atualização remove somente o antigo bloco
  gerenciado pelo projeto, preservando qualquer configuração do usuário.
- Escreve somente em `game/dota_brazilian` e preserva uma cópia dessa pasta
  quando ela já existia.
- Não altera `game/dota/gameinfo.gi`. O Dota monta `dota_brazilian` pelo
  `Game_Language` nativo quando **Português (Brasil)** está selecionado no menu.
- Versões antigas que continham o bloco identificado do projeto em
  `game/dota/gameinfo.gi` são migradas removendo apenas esse bloco legado.
- A Steam pode permanecer aberta; somente o Dota precisa estar fechado durante
  instalar, reparar ou restaurar.
- O rollback é centralizado: captions primeiro, áudio depois.
- O instalador não edita executáveis, não injeta DLL e não substitui
  `game/dota/pak01_dir.vpk`.
- O narrador com áudio inglês solicita tokens prefixados por `[english]`. A
  camada `dota_brazilian` fornece aliases PT-BR para esses identificadores sem
  editar ou substituir a localização inglesa original.
- A tabela PT-BR do narrador é exposta somente como recurso `brazilian`.
  O Dota precisa estar carregando esse idioma; não há cópias com sufixos
  `english` ou `russian`, nem dependência de `cc_lang`.
- O executável publicado é self-contained e não exige .NET, Node.js nem uma
  cópia deste repositório.

## Limites obrigatórios

O instalador não pode escrever em:

- `game/dota/gameinfo.gi`;
- `game/dota/pak01_dir.vpk` ou qualquer VPK-base;
- executáveis ou DLLs;
- `game/dota/cfg/autoexec.cfg`;
- opções de inicialização salvas pela Steam.

O único destino permanente do produto é `game/dota_brazilian`. Alterações
nesses limites exigem uma nova decisão técnica documentada e não podem ser
publicadas apenas como ajuste de implementação. Consulte
[`CAPTION_INSTALLATION_DECISION.md`](../docs/experiments/CAPTION_INSTALLATION_DECISION.md).

## Desenvolvimento

```powershell
node .\scripts\build-windows-installer-icon.mjs
node .\scripts\build-windows-installer-payload.mjs
dotnet build .\installer\DublagemBrasileira.Installer\DublagemBrasileira.Installer.csproj
dotnet run --project .\installer\DublagemBrasileira.Installer.Tests
dotnet run --project .\installer\DublagemBrasileira.Installer
```

Publicação self-contained:

```powershell
dotnet publish .\installer\DublagemBrasileira.Installer `
  -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true -p:DebugType=None `
  -o .\build\windows-installer
```

O teste automatizado cria uma estrutura Steam temporária e também relata, em
modo somente leitura, quais instalações reais foram encontradas.
