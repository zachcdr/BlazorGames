using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
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

        public async Task<IList<GameDetails>> GetGames()
        {
            var gameResponse = await _gameRepo.GetGames();

            var gameDetails = new List<GameDetails>();

            foreach (var game in gameResponse)
            {
                gameDetails.Add(Converter<GameDetails>.FromJson(game));
            }

            return gameDetails;
        }
    }
}
