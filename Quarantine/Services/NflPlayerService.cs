using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflPlayerService : INflPlayerService
    {
        private const string NFL_PICKEMS_PLAYERS = "Players";

        private readonly IHandleGameState _handleGameState;

        public NflPlayerService(IHandleGameState handleGameState)
        {
            _handleGameState = handleGameState;
        }

        public async Task<List<Player>> GetPlayers()
        {
            return Converter<List<Player>>.FromJson(await _handleGameState.LoadGame(GameType.NflPickems, NFL_PICKEMS_PLAYERS));
        }

        public async Task SavePlayerPassword(int playerId, string password)
        {
            var players = await GetPlayers();
            players.Single(p => p.Id == playerId).Password = password;
            await _handleGameState.SaveGame(GameType.NflPickems, NFL_PICKEMS_PLAYERS, Converter<List<Player>>.ToJson(players));
        }
    }
}
