using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using Quarantine.Responses;

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
                IList<string> list = await _gameRepo.GetGames(gameType);
                List<GameDetails> list2 = new List<GameDetails>();
                foreach (string item in list)
                {
                    list2.Add(Converter<GameDetails>.FromJson(item));
                }
                return new ServiceResponse<IList<GameDetails>>(list2.OrderByDescending((GameDetails g) => g.CreatedOn).ToList(), isSuccess: true);
            }
            catch (Exception ex)
            {
                return new ServiceResponse<IList<GameDetails>>(null, isSuccess: false, ex.Message);
            }
        }
    }
}
