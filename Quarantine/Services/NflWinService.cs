using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Interfaces;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflWinService : INflWinService
    {
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
    }
}
