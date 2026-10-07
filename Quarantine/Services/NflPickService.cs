using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    public class NflPickService : INflPickService
    {
        // NOTE: every week's picks are stored in this one blob, despite the name.
        private const string NFL_PICKEMS_PICKS = "Week4Picks";

        private readonly IHandleGameState _handleGameState;

        public NflPickService(IHandleGameState handleGameState)
        {
            _handleGameState = handleGameState;
        }

        public async Task<List<Pick>> GetPicks()
        {
            return Converter<List<Pick>>.FromJson(await _handleGameState.LoadGame(GameType.NflPickems, NFL_PICKEMS_PICKS));
        }

        public async Task SavePicks(List<Pick> picks)
        {
            var currentPicks = await GetPicks();
            picks.ForEach(p =>
            {
                var existing = currentPicks.SingleOrDefault(cp => cp.GameId == p.GameId && p.PlayerId == cp.PlayerId);
                if (existing != null)
                {
                    existing.TeamId = p.TeamId;
                    existing.TieBreaker = p.TieBreaker;
                }
                else
                {
                    currentPicks.Add(p);
                }
            });
            await _handleGameState.SaveGame(GameType.NflPickems, NFL_PICKEMS_PICKS, Converter<List<Pick>>.ToJson(currentPicks));
        }
    }
}
