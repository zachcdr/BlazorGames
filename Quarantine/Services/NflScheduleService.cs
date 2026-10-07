using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflScheduleService : INflScheduleService
    {
        private const string NFL_PICKEMS_SCHEDULE = "NflSchedule";

        private readonly IHandleGameState _handleGameState;

        public NflScheduleService(IHandleGameState handleGameState)
        {
            _handleGameState = handleGameState;
        }

        public async Task<List<Game>> GetSchedule()
        {
            return Converter<List<Game>>.FromJson(await _handleGameState.LoadGame(GameType.NflPickems, NFL_PICKEMS_SCHEDULE));
        }

        public async Task SaveSchedule(List<Game> games)
        {
            await _handleGameState.SaveGame(GameType.NflPickems, NFL_PICKEMS_SCHEDULE, Converter<List<Game>>.ToJson(games));
        }
    }
}
