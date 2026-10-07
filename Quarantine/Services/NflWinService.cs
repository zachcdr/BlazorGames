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
            var schedule = await _nflScheduleService.GetSchedule();
            var teams = await _nflTeamService.GetTeams();

            if (week.HasValue)
            {
                schedule = schedule.Where(s => s.Week == week.Value).ToList();
            }

            var picks = await _nflPickService.GetPicks();
            var players = await _nflPlayerService.GetPlayers();

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
