using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Helpers
{
    /// <summary>
    /// Team colors and abbreviations for the NFL Pickems pages, matched loosely on the team's stored name
    /// ("Chiefs", "Kansas City Chiefs" and "Kansas City" all resolve to KC).
    /// </summary>
    public static class NflTeamStyle
    {
        private class TeamStyle
        {
            public string Abbreviation;
            public string Primary;
            public string Secondary;
            public string[] Keys;
        }

        private static readonly List<TeamStyle> Teams = new List<TeamStyle>
        {
            new TeamStyle { Abbreviation = "ARI", Primary = "#97233F", Secondary = "#FFB612", Keys = new[] { "cardinals", "arizona" } },
            new TeamStyle { Abbreviation = "ATL", Primary = "#A71930", Secondary = "#101820", Keys = new[] { "falcons", "atlanta" } },
            new TeamStyle { Abbreviation = "BAL", Primary = "#241773", Secondary = "#9E7C0C", Keys = new[] { "ravens", "baltimore" } },
            new TeamStyle { Abbreviation = "BUF", Primary = "#00338D", Secondary = "#C60C30", Keys = new[] { "bills", "buffalo" } },
            new TeamStyle { Abbreviation = "CAR", Primary = "#0085CA", Secondary = "#101820", Keys = new[] { "panthers", "carolina" } },
            new TeamStyle { Abbreviation = "CHI", Primary = "#0B162A", Secondary = "#C83803", Keys = new[] { "bears", "chicago" } },
            new TeamStyle { Abbreviation = "CIN", Primary = "#FB4F14", Secondary = "#101820", Keys = new[] { "bengals", "cincinnati" } },
            new TeamStyle { Abbreviation = "CLE", Primary = "#311D00", Secondary = "#FF3C00", Keys = new[] { "browns", "cleveland" } },
            new TeamStyle { Abbreviation = "DAL", Primary = "#003594", Secondary = "#869397", Keys = new[] { "cowboys", "dallas" } },
            new TeamStyle { Abbreviation = "DEN", Primary = "#FB4F14", Secondary = "#002244", Keys = new[] { "broncos", "denver" } },
            new TeamStyle { Abbreviation = "DET", Primary = "#0076B6", Secondary = "#B0B7BC", Keys = new[] { "lions", "detroit" } },
            new TeamStyle { Abbreviation = "GB", Primary = "#203731", Secondary = "#FFB612", Keys = new[] { "packers", "green bay" } },
            new TeamStyle { Abbreviation = "HOU", Primary = "#03202F", Secondary = "#A71930", Keys = new[] { "texans", "houston" } },
            new TeamStyle { Abbreviation = "IND", Primary = "#002C5F", Secondary = "#A2AAAD", Keys = new[] { "colts", "indianapolis" } },
            new TeamStyle { Abbreviation = "JAX", Primary = "#006778", Secondary = "#D7A22A", Keys = new[] { "jaguars", "jacksonville" } },
            new TeamStyle { Abbreviation = "KC", Primary = "#E31837", Secondary = "#FFB81C", Keys = new[] { "chiefs", "kansas city" } },
            new TeamStyle { Abbreviation = "LV", Primary = "#000000", Secondary = "#A5ACAF", Keys = new[] { "raiders", "las vegas" } },
            new TeamStyle { Abbreviation = "LAC", Primary = "#0080C6", Secondary = "#FFC20E", Keys = new[] { "chargers" } },
            new TeamStyle { Abbreviation = "LAR", Primary = "#003594", Secondary = "#FFA300", Keys = new[] { "rams" } },
            new TeamStyle { Abbreviation = "MIA", Primary = "#008E97", Secondary = "#FC4C02", Keys = new[] { "dolphins", "miami" } },
            new TeamStyle { Abbreviation = "MIN", Primary = "#4F2683", Secondary = "#FFC62F", Keys = new[] { "vikings", "minnesota" } },
            new TeamStyle { Abbreviation = "NE", Primary = "#002244", Secondary = "#C60C30", Keys = new[] { "patriots", "new england" } },
            new TeamStyle { Abbreviation = "NO", Primary = "#101820", Secondary = "#D3BC8D", Keys = new[] { "saints", "new orleans" } },
            new TeamStyle { Abbreviation = "NYG", Primary = "#0B2265", Secondary = "#A71930", Keys = new[] { "giants" } },
            new TeamStyle { Abbreviation = "NYJ", Primary = "#125740", Secondary = "#FFFFFF", Keys = new[] { "jets" } },
            new TeamStyle { Abbreviation = "PHI", Primary = "#004C54", Secondary = "#A5ACAF", Keys = new[] { "eagles", "philadelphia" } },
            new TeamStyle { Abbreviation = "PIT", Primary = "#101820", Secondary = "#FFB612", Keys = new[] { "steelers", "pittsburgh" } },
            new TeamStyle { Abbreviation = "SF", Primary = "#AA0000", Secondary = "#B3995D", Keys = new[] { "49ers", "niners", "san francisco" } },
            new TeamStyle { Abbreviation = "SEA", Primary = "#002244", Secondary = "#69BE28", Keys = new[] { "seahawks", "seattle" } },
            new TeamStyle { Abbreviation = "TB", Primary = "#D50A0A", Secondary = "#34302B", Keys = new[] { "buccaneers", "bucs", "tampa" } },
            new TeamStyle { Abbreviation = "TEN", Primary = "#0C2340", Secondary = "#4B92DB", Keys = new[] { "titans", "tennessee" } },
            new TeamStyle { Abbreviation = "WAS", Primary = "#5A1414", Secondary = "#FFB612", Keys = new[] { "commanders", "washington" } },
        };

        private static TeamStyle Find(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return null;
            }
            var lower = name.ToLowerInvariant();
            return Teams.FirstOrDefault(t => t.Keys.Any(k => lower.Contains(k)))
                ?? Teams.FirstOrDefault(t => string.Equals(t.Abbreviation, name.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        public static string Abbreviation(string name)
        {
            var team = Find(name);
            if (team != null)
            {
                return team.Abbreviation;
            }
            return string.IsNullOrWhiteSpace(name) ? "?" : name.Trim().Substring(0, Math.Min(3, name.Trim().Length)).ToUpperInvariant();
        }

        /// <summary>Inline CSS variables (--team / --team-alt) consumed by nfl-pickems.css.</summary>
        public static string CssVars(string name)
        {
            var team = Find(name);
            return team == null
                ? "--team: #3b4252; --team-alt: #8892a6;"
                : $"--team: {team.Primary}; --team-alt: {team.Secondary};";
        }

        /// <summary>Kickoff time shown in Pacific (the league is around Seattle), regardless of the server's time zone.</summary>
        public static string Kickoff(DateTime gameTimeUtc)
        {
            if (!NflPickLock.IsScheduled(gameTimeUtc))
            {
                return "Kickoff TBD";
            }
            var pacific = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(gameTimeUtc, DateTimeKind.Utc), NflPickLock.PacificTimeZone());
            return pacific.ToString("ddd h:mm tt") + " PT";
        }
    }
}
