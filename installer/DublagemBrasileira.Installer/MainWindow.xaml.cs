using System.Diagnostics;
using System.Windows;
using System.Windows.Media;
using DublagemBrasileira.Installer.Models;
using DublagemBrasileira.Installer.Services;
using Microsoft.Win32;

namespace DublagemBrasileira.Installer;

public partial class MainWindow : Window
{
    private readonly DotaLocator _dotaLocator = new();
    private readonly InstallerSettings _settings = InstallerSettings.Load();
    private readonly InstallerEngine _engine;
    private DotaInstallation? _installation;
    private bool _operationRunning;

    public MainWindow()
    {
        InitializeComponent();
        _engine = new InstallerEngine(AppendLog, SetDownloadProgress);
        Loaded += async (_, _) =>
        {
            DiscoverDota();
            await RefreshReleaseInfoAsync();
        };
    }

    private void DiscoverDota()
    {
        SetBusy(true, "Procurando nas bibliotecas configuradas na Steam…", discoveryOnly: true);
        try
        {
            DotaInstallation? selected = null;
            if (_dotaLocator.TryValidate(_settings.DotaRoot, out var savedRoot))
            {
                selected = CreateManualInstallation(savedRoot);
            }

            selected ??= _dotaLocator.FindInstallations().FirstOrDefault();
            SelectInstallation(selected);
        }
        finally
        {
            SetBusy(false, null, discoveryOnly: true);
        }
    }

    private void SelectInstallation(DotaInstallation? installation)
    {
        _installation = installation;
        if (installation is null)
        {
            DetectionTitle.Text = "Dota 2 não encontrado automaticamente";
            DotaPathText.Text = "Escolha a pasta “dota 2 beta” para continuar";
            DotaBuildText.Text = "Também aceitamos a pasta game\\dota";
            InstallValidText.Text = "Aguardando uma pasta válida";
            SetDot(InstallValidDot, false);
            UpdateActionAvailability();
            RefreshSnapshot();
            return;
        }

        _settings.DotaRoot = installation.DotaRoot;
        _settings.Save();
        DetectionTitle.Text = "Dota 2 encontrado";
        DotaPathText.Text = installation.DotaRoot;
        DotaBuildText.Text = installation.BuildId is null
            ? $"Biblioteca Steam: {installation.SteamLibrary}"
            : $"Build Steam {installation.BuildId} · {installation.SteamLibrary}";
        InstallValidText.Text = "pak01_dir.vpk e boot.vcfg encontrados";
        SetDot(InstallValidDot, true);

        UpdateActionAvailability();
        RefreshSnapshot();
    }

    private void RefreshSnapshot()
    {
        var dotaRunning = Process.GetProcessesByName("dota2").Length > 0;
        DotaClosedText.Text = dotaRunning ? "Feche o jogo para continuar" : "Nenhum processo dota2.exe aberto";
        SetDot(DotaClosedDot, !dotaRunning);

        if (_installation is null)
        {
            BackupText.Text = "Será criado antes de qualquer alteração";
            SetDot(BackupDot, false);
            UpdateActionAvailability();
            return;
        }

        var snapshot = _engine.Inspect(_installation.DotaRoot);
        if (snapshot.IsInstalled)
        {
            InstallButton.Content = "Atualizar instalação";
            OperationStatus.Text = snapshot.BrazilianLayerReady
                ? "Camada instalada. Selecione Português (Brasil) no menu de idioma do Dota."
                : "A instalação foi encontrada, mas a camada precisa ser reparada.";
        }
        else
        {
            InstallButton.Content = "Instalar";
            if (!_operationRunning)
            {
                OperationStatus.Text = "Nenhuma alteração será feita sem sua confirmação.";
            }
        }

        BackupTitle.Text = snapshot.HasRestorableBackup
            ? "Restauração disponível"
            : snapshot.IsInstalled
                ? "Instalação existente"
                : "Backup preventivo";
        BackupText.Text = snapshot.HasRestorableBackup
            ? "Backup gerenciado encontrado"
            : snapshot.IsInstalled
                ? "Dublagem detectada; backup anterior não encontrado"
                : "Será criado antes de qualquer alteração";
        SetDot(BackupDot, snapshot.IsInstalled || snapshot.HasRestorableBackup);
        RepairButton.IsEnabled = !_operationRunning &&
                                 !snapshot.DotaRunning &&
                                 snapshot.CaptionsManifestPresent;
        RestoreButton.IsEnabled = !_operationRunning &&
                                  !snapshot.DotaRunning &&
                                  snapshot.HasRestorableBackup;
        InstallButton.IsEnabled = !_operationRunning &&
                                  !snapshot.DotaRunning &&
                                  RiskAcknowledgement.IsChecked == true;
    }

    private void Browse_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog
        {
            Title = "Selecione a pasta dota 2 beta ou game\\dota",
            Multiselect = false,
            InitialDirectory = _installation?.DotaRoot
        };
        if (dialog.ShowDialog(this) != true)
        {
            return;
        }

        if (!_dotaLocator.TryValidate(dialog.FolderName, out var dotaRoot))
        {
            MessageBox.Show(
                this,
                "Essa pasta não parece ser uma instalação válida do Dota 2.\n\n" +
                "Selecione “dota 2 beta” ou “dota 2 beta\\game\\dota”.",
                "Dota 2 não encontrado",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        SelectInstallation(CreateManualInstallation(dotaRoot));
    }

    private void Rescan_Click(object sender, RoutedEventArgs e) => DiscoverDota();

    private async void Install_Click(object sender, RoutedEventArgs e)
    {
        if (!CanRunAction())
        {
            return;
        }
        if (RiskAcknowledgement.IsChecked != true)
        {
            MessageBox.Show(
                this,
                "Leia as informações sobre a camada de idioma e confirme que compreendeu.",
                "Confirmação necessária",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        var mode = SelectedInstallMode();

        var confirmation = MessageBox.Show(
            this,
            "O instalador vai criar backups e aplicar " +
            (mode == InstallMode.CaptionsOnly
                ? "somente as legendas PT-BR."
                : "as legendas PT-BR e o pack de voz do Axe.") +
            "\n\nEsta é uma modificação comunitária não oficial. " +
            "O Dota deve permanecer fechado durante a instalação. A Steam pode " +
            "continuar aberta; arquivos-base, autoexec e opções salvas de inicialização " +
            "não serão alterados. O idioma é selecionado dentro do próprio Dota. " +
            "Deseja continuar?",
            "Instalar Dublagem Brasileira",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirmation != MessageBoxResult.Yes)
        {
            return;
        }

        await RunOperationAsync(
            "Instalando e criando backups…",
            token => _engine.InstallOrUpdateAsync(_installation!.DotaRoot, mode, token));
    }

    private async void Repair_Click(object sender, RoutedEventArgs e)
    {
        if (!CanRunAction())
        {
            return;
        }

        await RunOperationAsync(
            "Verificando e reativando a camada…",
            token => _engine.RepairAsync(
                _installation!.DotaRoot,
                SelectedInstallMode(),
                token));
    }

    private async void Restore_Click(object sender, RoutedEventArgs e)
    {
        if (!CanRunAction())
        {
            return;
        }

        var confirmation = MessageBox.Show(
            this,
            "Isso remove as alterações gerenciadas pelo instalador e restaura os backups " +
            "na ordem correta: captions primeiro, áudio depois.\n\nContinuar?",
            "Restaurar estado anterior",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
        if (confirmation != MessageBoxResult.Yes)
        {
            return;
        }

        await RunOperationAsync(
            "Restaurando o estado anterior…",
            token => _engine.RestoreAsync(_installation!.DotaRoot, token));
    }

    private async Task RunOperationAsync(
        string initialStatus,
        Func<CancellationToken, Task> operation)
    {
        _operationRunning = true;
        LogText.Text = string.Empty;
        SetBusy(true, initialStatus);
        try
        {
            await operation(CancellationToken.None);
            OperationStatus.Text = "Concluído com segurança.";
        }
        catch (Exception exception)
        {
            AppendLog($"ERRO: {exception.Message}");
            OperationStatus.Text = exception.Message;
            MessageBox.Show(
                this,
                exception.Message,
                "Não foi possível concluir",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
        finally
        {
            _operationRunning = false;
            SetBusy(false);
            RefreshSnapshot();
        }
    }

    private bool CanRunAction()
    {
        if (_installation is not null)
        {
            return true;
        }

        MessageBox.Show(
            this,
            "Localize uma instalação válida do Dota 2 primeiro.",
            "Ação indisponível",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
        return false;
    }

    private void AppendLog(string message)
    {
        Dispatcher.Invoke(() =>
        {
            if (!string.IsNullOrWhiteSpace(LogText.Text))
            {
                LogText.Text += Environment.NewLine;
            }
            LogText.Text += $"[{DateTime.Now:HH:mm:ss}] {message}";
            OperationStatus.Text = message;
        });
    }

    private void SetBusy(bool busy, string? status = null, bool discoveryOnly = false)
    {
        if (!discoveryOnly)
        {
        OperationProgress.Visibility = busy ? Visibility.Visible : Visibility.Collapsed;
            OperationProgress.IsIndeterminate = busy;
            if (status is not null)
            {
                OperationStatus.Text = status;
            }
        }

        RescanButton.IsEnabled = !busy;
        if (busy)
        {
            InstallButton.IsEnabled = false;
            RepairButton.IsEnabled = false;
            RestoreButton.IsEnabled = false;
        }
        else
        {
            UpdateActionAvailability();
        }
    }

    private void UpdateActionAvailability()
    {
        var available = !_operationRunning &&
                        _installation is not null &&
                        RiskAcknowledgement.IsChecked == true;
        InstallButton.IsEnabled = available;
        RepairButton.IsEnabled = false;
        RestoreButton.IsEnabled = false;
    }

    private static DotaInstallation CreateManualInstallation(string root)
    {
        var library = Directory.GetParent(
            Directory.GetParent(
                Directory.GetParent(root)!.FullName)!.FullName)!.FullName;
        var manifest = Path.Combine(library, "steamapps", "appmanifest_570.acf");
        return new DotaInstallation(root, library, File.Exists(manifest), null);
    }

    private void SetDot(System.Windows.Shapes.Shape dot, bool positive)
    {
        dot.Fill = positive
            ? (Brush)FindResource("YellowBrush")
            : new SolidColorBrush(Color.FromRgb(174, 197, 185));
    }

    private InstallMode SelectedInstallMode() =>
        CaptionsAndAxeRadio.IsChecked == true
            ? InstallMode.CaptionsAndAxe
            : InstallMode.CaptionsOnly;

    private void RiskAcknowledgement_Changed(object sender, RoutedEventArgs e)
    {
        if (IsLoaded)
        {
            RefreshSnapshot();
        }
    }

    private async Task RefreshReleaseInfoAsync()
    {
        try
        {
            var manifest = await _engine.GetReleaseManifestAsync(CancellationToken.None);
            var voiceLines = manifest.VoicePacks.Sum(pack => pack.Lines);
            CaptionSummaryText.Text =
                $"{manifest.Captions.Tokens:N0} captions PT-BR do site, " +
                $"incluindo heróis, variantes e narrador. " +
                $"{manifest.Captions.EnglishAudioAliases:N0} aliases mantêm as " +
                "legendas quando a voz original está em inglês.";
            VoiceSummaryText.Text =
                $"{manifest.VoicePacks.Count} pack disponível, com " +
                $"{voiceLines:N0} falas compiladas.";
            AppendLog($"Canal estável: versão {manifest.Version}.");
        }
        catch (Exception exception)
        {
            CaptionSummaryText.Text =
                "O catálogo completo será consultado no GitHub ao instalar.";
            AppendLog($"Não foi possível consultar o canal estável: {exception.Message}");
        }
    }

    private void SetDownloadProgress(double? progress)
    {
        Dispatcher.Invoke(() =>
        {
            OperationProgress.IsIndeterminate = progress is null;
            if (progress is not null)
            {
                OperationProgress.Value = Math.Clamp(progress.Value * 100, 0, 100);
            }
        });
    }
}
