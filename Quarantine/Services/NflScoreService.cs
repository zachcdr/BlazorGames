using Quarantine.Interfaces;
using Quarantine.Models;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Quarantine.Services
{
    public class NflScoreService
    {
        private HttpClient _httpClient;

        public NflScoreService(HttpClient httpClient)
        {
            _httpClient = new HttpClient();
        }

        public async Task<List<NflGameScore>> GetWeekScores(string week)
        {
            var response = await _httpClient.GetAsync(
                $"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={week}&dates={2026}");

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);
            var games = new List<NflGameScore>();

            foreach (var ev in doc.RootElement.GetProperty("events").EnumerateArray())
            {
                var comp = ev.GetProperty("competitions")[0];
                var isFinal = comp.GetProperty("status").GetProperty("type").GetProperty("completed").GetBoolean();

                string home = "", away = "";
                int homeScore = 0, awayScore = 0;

                foreach (var team in comp.GetProperty("competitors").EnumerateArray())
                {
                    var abbr = team.GetProperty("team").GetProperty("abbreviation").GetString()!;
                    int.TryParse(team.GetProperty("score").GetString(), out var score);

                    if (team.GetProperty("homeAway").GetString() == "home")
                        (home, homeScore) = (abbr, score);
                    else
                        (away, awayScore) = (abbr, score);
                }

                games.Add(new NflGameScore
                {
                    AwayTeam = away,
                    AwayTeamId = NflTeamMapper.GetTeamId(away),
                    AwayScore = awayScore,
                    HomeTeam = home,
                    HomeTeamId = NflTeamMapper.GetTeamId(home),
                    HomeScore = homeScore,
                    IsFinal = isFinal
                });
            }

            return games;
        }
    }
}
