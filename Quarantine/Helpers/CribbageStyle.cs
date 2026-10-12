using System.Globalization;

namespace Quarantine.Helpers
{
    public static class CribbageStyle
    {
        /// <summary>Peg colors by seat: red, blue, green, like a real peg set.</summary>
        private static readonly string[] PegColors = { "#e0453a", "#3b82f6", "#22a06b" };

        public static string PegColor(int playerIndex)
        {
            return PegColors[playerIndex % PegColors.Length];
        }

        /// <summary>SVG coordinates are always written with a "." decimal point, whatever the server's culture.</summary>
        public static string Num(double value)
        {
            return value.ToString("0.##", CultureInfo.InvariantCulture);
        }
    }
}
