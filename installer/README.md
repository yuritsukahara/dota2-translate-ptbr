# Instalador Windows

Aplicativo WPF self-contained para instalar, reparar e restaurar o addon comunitário.

## Compilar

```powershell
dotnet test .\Dota2Translate.Tests\Dota2Translate.Tests.csproj -c Release
dotnet publish .\Dota2Translate.Installer\Dota2Translate.Installer.csproj -c Release -r win-x64 --self-contained true
```

O instalador:

- detecta bibliotecas Steam padrão e alternativas;
- valida a pasta do Dota por `gameinfo.gi` e `pak01_dir.vpk`;
- bloqueia operações enquanto o processo do jogo está aberto;
- instala apenas nas pastas isoladas `dota2_translate_ptbr`;
- move a versão anterior para backup antes da troca;
- restaura o backup automaticamente se uma etapa falhar;
- permite restauração explícita e verificação SHA-256.

O modo de cliente normal permanece bloqueado no código. Ele só poderá ser habilitado por um manifesto de compatibilidade assinado e após comprovação de que a montagem funciona sem injeção, bypass de VAC/CRC ou alteração de executáveis.
