using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using Quarantine.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<ServiceResponse<IList<GameDetails>>> GetGames(GameType gameType)
        {
            try
            {
                var gameResponse = await _gameRepo.GetGames(gameType);

                var gameDetails = new List<GameDetails>();

                foreach (var game in gameResponse)
                {
                    gameDetails.Add(Converter<GameDetails>.FromJson(game));
                }

                return new ServiceResponse<IList<GameDetails>>(gameDetails.OrderByDescending(g => g.CreatedOn).ToList(), true);
            }
            catch (Exception ex)
            {
                return new ServiceResponse<IList<GameDetails>>(null, false, ex.Message);
            }
        }
    }
}
