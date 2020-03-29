using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Quarantine.Services
{
    public class GameService
    {
        private readonly IHandleRetreivingGames _gameRepo;
        public GameService(IHandleRetreivingGames handleRetreivingGames)
        {
            _gameRepo = handleRetreivingGames;
        }

        public async Task<IList<GameDetails>> GetGames(GameType gameType)
        {
            var gameResponse = await _gameRepo.GetGames(gameType);

            var gameDetails = new List<GameDetails>();

            foreach (var game in gameResponse)
            {
                gameDetails.Add(Converter<GameDetails>.FromJson(game));
            }

            return gameDetails;
        }
    }
}
