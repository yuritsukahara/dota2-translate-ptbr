if Dota2TranslatePTBR == nil then
    Dota2TranslatePTBR = class({})
end

function Activate()
    GameRules.Dota2TranslatePTBR = Dota2TranslatePTBR()
    GameRules.Dota2TranslatePTBR:InitGameMode()
end

function Dota2TranslatePTBR:InitGameMode()
    print("[Dota2 Translate PT-BR] Addon de teste carregado.")
end
