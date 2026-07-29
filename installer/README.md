# Instalador Windows

Aplicativo WPF em .NET 8 para localizar o Dota 2, baixar a versão estável do
GitHub, aplicar captions/vozes e restaurar o estado anterior.

## O que a descoberta verifica

1. Lê a instalação principal da Steam no Registro do Windows.
2. Abre `steamapps/libraryfolders.vdf`.
3. Percorre todas as bibliotecas Steam configuradas.
4. Procura `steamapps/common/dota 2 beta`.
5. Valida `game/dota/pak01_dir.vpk` e `game/dota/cfg/boot.vcfg`.
6. Lê o build no `appmanifest_570.acf`, quando disponível.
7. Detecta uma instalação existente pelas vozes compiladas, captions, VPK da
   camada brasileira e pela opção Steam `-language brazilian`.

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
- Preserva as opções de inicialização já configuradas e acrescenta
  `-language brazilian`, que monta `game/dota_brazilian` antes da camada base.
- Se a Steam estiver aberta, ela é encerrada e reaberta de forma normal uma vez
  para que a opção seja salva.
- O rollback é centralizado: captions primeiro, áudio depois.
- O instalador não edita executáveis, não injeta DLL e não substitui
  `game/dota/pak01_dir.vpk`.
- Nenhum token `[english]` precisa ser substituído: as captions PT-BR usam seus
  IDs normais dentro da camada brasileira separada.
- O executável publicado é self-contained e não exige .NET, Node.js nem uma
  cópia deste repositório.

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
