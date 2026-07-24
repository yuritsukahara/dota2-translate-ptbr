using Microsoft.Win32;
using Dota2TranslatePTBR.Services;

namespace Dota2TranslatePTBR;

public partial class MainWindow : System.Windows.Window
{
    private readonly SteamLocator _steam = new();
    private readonly InstallerService _installer = new();
    private string? _dotaRoot;
    private string? _packagePath;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += (_, _) => DetectDota();
    }

    private void DetectDota()
    {
        _dotaRoot = _steam.FindDotaRoot();
        DotaPathText.Text = _dotaRoot ?? "Dota 2 não foi encontrado automaticamente.";
        InstallButton.IsEnabled = _dotaRoot is not null && _packagePath is not null;
    }

    private void Locate_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog { Title = "Escolha a pasta “dota 2 beta”" };
        if (dialog.ShowDialog() == true)
        {
            _dotaRoot = dialog.FolderName;
            DotaPathText.Text = _dotaRoot;
            InstallButton.IsEnabled = _packagePath is not null;
        }
    }

    private void ChoosePackage_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog { Filter = "Pacote Dota 2 Translate (*.zip)|*.zip", CheckFileExists = true };
        if (dialog.ShowDialog() == true)
        {
            _packagePath = dialog.FileName;
            PackageText.Text = System.IO.Path.GetFileName(_packagePath);
            InstallButton.IsEnabled = _dotaRoot is not null;
        }
    }

    private async void Install_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        if (_dotaRoot is null || _packagePath is null) return;
        await Run(async () => await _installer.InstallAddonAsync(_dotaRoot, _packagePath, new Progress<string>(value => StatusText.Text = value)));
    }

    private async void Restore_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        if (_dotaRoot is null) return;
        await Run(async () => await _installer.RestoreAsync(_dotaRoot, new Progress<string>(value => StatusText.Text = value)));
    }

    private async Task Run(Func<Task> action)
    {
        InstallButton.IsEnabled = false;
        try
        {
            await action();
            StatusText.Text = "Operação concluída.";
        }
        catch (Exception error)
        {
            StatusText.Text = error.Message;
            System.Windows.MessageBox.Show(error.Message, "Dota 2 Translate PT-BR", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
        }
        finally
        {
            InstallButton.IsEnabled = _dotaRoot is not null && _packagePath is not null;
        }
    }
}
