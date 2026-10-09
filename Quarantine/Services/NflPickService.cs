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
    /// Every pick made before that layout existed is in the legacy "Week4Picks" file, which is read but never
    /// written. When both have a pick for the same player and game, the per-player file wins.
    /// </summary>
    public class NflPickService : INflPickService
    {
        private const int Season = 2026;

        // NOTE: every week's picks were stored in this one blob, despite the name. Read-only now.
        private const string LEGACY_PICKS = "Week4Picks";

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
            // Any failed read throws instead of returning fewer picks, so a save can never be based on a partial view.
            var legacyTask = _handleGameState.LoadGame(GameType.NflPickems, LEGACY_PICKS);

            // File names are "{Season}/picks/{week}/{playerId}", so one listing narrows to just the files needed.
            var prefix = week.HasValue ? $"{PicksPrefix}{week.Value}/" : PicksPrefix;
            var files = (await _handleGameState.ListGameFiles(GameType.NflPickems, prefix))
                .Where(f => !playerId.HasValue || f.EndsWith($"/{playerId.Value}"));
            var fileContents = await Task.WhenAll(files.Select(f => _handleGameState.LoadGame(GameType.NflPickems, f)));

            var picks = new Dictionary<(int PlayerId, int GameId), Pick>();
            foreach (var pick in (Converter<List<Pick>>.FromJson(await legacyTask) ?? new List<Pick>())
                .Where(p => !playerId.HasValue || p.PlayerId == playerId.Value))
            {
                picks[(pick.PlayerId, pick.GameId)] = pick;
            }
            foreach (var pick in fileContents.SelectMany(json => Converter<List<Pick>>.FromJson(json) ?? new List<Pick>()))
            {
                picks[(pick.PlayerId, pick.GameId)] = pick;
            }

            return picks.Values.ToList();
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
                // Each file holds the player's whole week, including picks carried over from the legacy file.
                var currentPicks = await GetPicks(group.Key.Week, group.Key.PlayerId);
                var weekPicks = currentPicks
                    .Where(cp => weekByGameId.TryGetValue(cp.GameId, out var week) && week == group.Key.Week)
                    .ToDictionary(cp => cp.GameId);
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
