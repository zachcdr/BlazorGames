using System.Linq;
using Quarantine.Models.Enums;

namespace Quarantine.Helpers
{
    /// <summary>Small display helpers for the Dot Game pages.</summary>
    public static class GolfStyle
    {
        public static string DotIcon(DotType dot)
        {
            switch (dot)
            {
                case DotType.Hogan: return "🎯";
                case DotType.Arnie: return "🌲";
                case DotType.SandySave: return "🏖️";
                case DotType.Birdie: return "🐦";
                case DotType.WinTheHole: return "🏆";
                case DotType.Pulley: return "🪝";
                case DotType.Chippie: return "🥄";
                case DotType.ClosestToPin: return "📍";
                case DotType.Bingo: return "1️⃣";
                case DotType.Bango: return "2️⃣";
                case DotType.Bongo: return "3️⃣";
                default: return "●";
            }
        }

        public static string Initials(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return "?";
            }
            var parts = name.Trim().Split(' ').Where(p => p.Length > 0).ToArray();
            return parts.Length > 1
                ? (parts[0].Substring(0, 1) + parts[parts.Length - 1].Substring(0, 1)).ToUpperInvariant()
                : parts[0].Substring(0, 1).ToUpperInvariant();
        }

        /// <summary>Scorecard mark for a score relative to par (circle under, square over).</summary>
        public static string ScoreClass(int score, int? par)
        {
            if (score <= 0 || !par.HasValue)
            {
                return "";
            }
            var diff = score - par.Value;
            if (diff <= -2) return "is-eagle";
            if (diff == -1) return "is-birdie";
            if (diff == 1) return "is-bogey";
            if (diff >= 2) return "is-double";
            return "";
        }

        public static string ToPar(int diff)
        {
            return diff == 0 ? "E" : diff > 0 ? "+" + diff : diff.ToString();
        }
    }
}
