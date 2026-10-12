using System;
using System.Collections.Generic;

namespace Quarantine.Services
{
    public static class NflTeamMapper
    {
        private static readonly Dictionary<string, int> EspnAbbrToTeamId = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["ARI"] = 1,  // Cardinals
            ["ATL"] = 2,  // Falcons
            ["BAL"] = 3,  // Ravens
            ["BUF"] = 4,  // Bills
            ["CAR"] = 5,  // Panthers
            ["CHI"] = 6,  // Bears
            ["CIN"] = 7,  // Bengals
            ["CLE"] = 8,  // Browns
            ["DAL"] = 9,  // Cowboys
            ["DEN"] = 10, // Broncos
            ["DET"] = 11, // Lions
            ["GB"] = 12, // Packers
            ["HOU"] = 13, // Texans
            ["IND"] = 14, // Colts
            ["JAX"] = 15, // Jaguars
            ["KC"] = 16, // Chiefs
            ["LV"] = 17, // Raiders
            ["LAC"] = 18, // Chargers
            ["LAR"] = 19, // Rams
            ["MIA"] = 20, // Dolphins
            ["MIN"] = 21, // Vikings
            ["NE"] = 22, // Patriots
            ["NO"] = 23, // Saints
            ["NYG"] = 24, // Giants
            ["NYJ"] = 25, // Jets
            ["PHI"] = 26, // Eagles
            ["PIT"] = 27, // Steelers
            ["SF"] = 28, // 49ers
            ["SEA"] = 29, // Seahawks
            ["TB"] = 30, // Buccaneers
            ["TEN"] = 31, // Titans
            ["WSH"] = 32, // Commanders
        };

        public static int? GetTeamId(string espnAbbreviation)
        {
            EspnAbbrToTeamId.TryGetValue(espnAbbreviation, out var id);

            return id;
        }
    }
}
