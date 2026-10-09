using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    /// <summary>
    /// Picks are saved as one file per player per week: "{Season}/picks/{week}/{playerId}.json".
    /// (Picks from before that layout were migrated out of the old "Week4Picks" file, which is kept only as a backup.)
    /// </summary>
    public class NflPickService : INflPickService
    {
        private const int Season = 2026;

        private static readonly string PicksPrefix = $"{Season}/picks/";

        private readonly IHandleGameState _handleGameState;
        private readonly INflScheduleService _nflScheduleService;

        public NflPickService(IHandleGameState handleGameState, INflScheduleService nflScheduleService)
        {
            _handleGameState = handleGameState;
            _nflScheduleService = nflScheduleService;
        }

        public async Task<List<Pick>> GetPicks(int? week = null, int? playerId = null)
        {
            // File names are "{Season}/picks/{week}/{playerId}", so one listing narrows to just the files needed.
            // Any failed read throws instead of returning fewer picks, so a save can never be based on a partial view.
            var prefix = week.HasValue ? $"{PicksPrefix}{week.Value}/" : PicksPrefix;
            var files = (await _handleGameState.ListGameFiles(GameType.NflPickems, prefix))
                .Where(f => !playerId.HasValue || f.EndsWith($"/{playerId.Value}"));
            var contents = await Task.WhenAll(files.Select(f => _handleGameState.LoadGame(GameType.NflPickems, f)));
            return contents.SelectMany(json => Converter<List<Pick>>.FromJson(json) ?? new List<Pick>()).ToList();
        }

        public async Task SavePicks(List<Pick> picks)
        {
            if (picks.Count == 0)
            {
                return;
            }

            var weekByGameId = (await _nflScheduleService.GetSchedule()).ToDictionary(g => g.Id, g => g.Week);

            foreach (var group in picks.GroupBy(p => (Week: weekByGameId[p.GameId], p.PlayerId)))
            {
                // Each file holds the player's whole week, so merge into what's already saved.
                var weekPicks = (await GetPicks(group.Key.Week, group.Key.PlayerId)).ToDictionary(p => p.GameId);
                foreach (var pick in group)
                {
                    weekPicks[pick.GameId] = pick;
                }

                var file = $"{PicksPrefix}{group.Key.Week}/{group.Key.PlayerId}";
                await _handleGameState.SaveGame(GameType.NflPickems, file, Converter<List<Pick>>.ToJson(weekPicks.Values.OrderBy(p => p.GameId).ToList()));
            }
        }
    }
}
