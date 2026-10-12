using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflWinService : INflWinService
    {
        // Season standings, saved so the Totals page doesn't have to read every pick file.
        private static readonly string TotalsFile = $"{NflSeason.Year}/totals";

        private readonly INflScheduleService _nflScheduleService;
        private readonly INflPlayerService _nflPlayerService;
        private readonly INflTeamService _nflTeamService;
        private readonly INflPickService _nflPickService;
        private readonly IHandleGameState _handleGameState;

        public NflWinService(
            INflScheduleService nflScheduleService,
            INflPlayerService nflPlayerService,
            INflTeamService nflTeamService,
            INflPickService nflPickService,
            IHandleGameState handleGameState)
        {
            _nflScheduleService = nflScheduleService;
            _nflPlayerService = nflPlayerService;
            _nflTeamService = nflTeamService;
            _nflPickService = nflPickService;
            _handleGameState = handleGameState;
        }

        public async Task<List<PlayerPickView>> GetPlayerPickViews(int? week = null, int? playerId = null)
        {
            // These are independent blob reads, so load them side by side.
            var scheduleTask = _nflScheduleService.GetSchedule();
            var teamsTask = _nflTeamService.GetTeams();
            var picksTask = _nflPickService.GetPicks(week, playerId);
            var playersTask = _nflPlayerService.GetPlayers();
            await Task.WhenAll(scheduleTask, teamsTask, picksTask, playersTask);

            var schedule = await scheduleTask;
            var teams = await teamsTask;
            var picks = await picksTask;
            var players = await playersTask;

            if (week.HasValue)
            {
                schedule = schedule.Where(s => s.Week == week.Value).ToList();
            }

            if (playerId.HasValue)
            {
                players = players.Where(p => p.Id == playerId.Value).ToList();
            }

            return players
                .Select(player => new PlayerPickView(player, teams, schedule, picks.Where(p => p.PlayerId == player.Id).ToList()))
                .OrderByDescending(p => p.Wins)
                .ThenBy(p => p.TieBreaker)
                .ToList();
        }

        public async Task<List<PlayerTotal>> GetSeasonTotals()
        {
            var playersTask = _nflPlayerService.GetPlayers();
            var totals = await LoadTotals();
            var players = await playersTask;

            // No snapshot yet, or a player was added since it was saved: build it now.
            if (totals == null || players.Any(p => totals.All(t => t.PlayerId != p.Id)))
            {
                totals = await ComputeAndSaveTotals();
            }

            // Names come from the player list, so a rename shows up without a refresh.
            var names = players.ToDictionary(p => p.Id, p => p.Name);
            return totals
                .Where(t => names.ContainsKey(t.PlayerId))
                .Select(t => new PlayerTotal { PlayerId = t.PlayerId, Name = names[t.PlayerId], Wins = t.Wins, TieBreaker = t.TieBreaker })
                .OrderByDescending(t => t.Wins)
                .ThenBy(t => t.TieBreaker)
                .ToList();
        }

        public Task RefreshSeasonTotals()
        {
            return ComputeAndSaveTotals();
        }

        private async Task<List<PlayerTotal>> ComputeAndSaveTotals()
        {
            var totals = (await GetPlayerPickViews())
                .Select(p => new PlayerTotal { PlayerId = p.Id, Name = p.Name, Wins = p.Wins, TieBreaker = p.TieBreaker })
                .ToList();
            await _handleGameState.SaveGame(GameType.NflPickems, TotalsFile, Converter<List<PlayerTotal>>.ToJson(totals));
            return totals;
        }

        private async Task<List<PlayerTotal>> LoadTotals()
        {
            // Loading a file that doesn't exist throws, so check the listing first.
            var exists = (await _handleGameState.ListGameFiles(GameType.NflPickems, TotalsFile)).Contains(TotalsFile);
            return exists
                ? Converter<List<PlayerTotal>>.FromJson(await _handleGameState.LoadGame(GameType.NflPickems, TotalsFile))
                : null;
        }
    }
}
