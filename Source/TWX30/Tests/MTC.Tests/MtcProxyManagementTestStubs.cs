namespace MTC;

public class AppPreferences
{
    public sealed class ProxyServerPreference
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Host { get; set; } = "127.0.0.1";
        public int ManagementPort { get; set; } = 2099;
        public string SecurityToken { get; set; } = string.Empty;
    }

    public static int NormalizeTcpPort(int value, int defaultValue)
        => value is >= 1 and <= 65535 ? value : defaultValue;
}

public class ConnectionProfile
{
    public const int DefaultSectors = 20000;
}
