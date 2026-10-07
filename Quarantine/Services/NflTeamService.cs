using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflTeamService : INflTeamService
    {
        private const string NFL_PICKEMS_TEAMS = "NflTeams";

        private readonly IHandleGameState _handleGameState;

        public NflTeamService(IHandleGameState handleGameState)
        {
            _handleGameState = handleGameState;
        }

        public async Task<List<Team>> GetTeams()
        {
            return Converter<List<Team>>.FromJson(await _handleGameState.LoadGame(GameType.NflPickems, NFL_PICKEMS_TEAMS));
        }
    }
}
