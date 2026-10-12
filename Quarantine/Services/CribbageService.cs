using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Cribbage;
using Quarantine.Models.Enums;

namespace Quarantine.Services
{
    /// <summary>
    /// Saves each cribbage game as its own file ("{id}.json" in the "cribbage" container). Every change reloads the
    /// latest copy first, so two phones scoring the same game don't overwrite each other's entries.
    /// </summary>
    public class CribbageService
    {
        /// <summary>Points entered in one go. A hand or crib maxes out at 29; this is just a typo guard.</summary>
        public const int MaxPointsPerEntry = 60;

        private readonly IHandleGameState _gameState;
        private readonly IHandleRetreivingGames _gameList;

        public CribbageService(IHandleGameState gameState, IHandleRetreivingGames gameList)
        {
            _gameState = gameState;
            _gameList = gameList;
        }

        public async Task<List<CribbageGame>> GetGames()
        {
            return (await _gameList.GetGames(GameType.Cribbage))
                .Select(json => Converter<CribbageGame>.FromJson(json))
                .OrderByDescending(g => g.LastModified)
                .ToList();
        }

        public async Task<CribbageGame> GetGame(Guid id)
        {
            return Converter<CribbageGame>.FromJson(await _gameState.LoadGame(GameType.Cribbage, id.ToString()));
        }

        public async Task<CribbageGame> CreateGame(string name, List<string> playerNames, int firstDealerIndex)
        {
            var game = new CribbageGame
            {
                Id = Guid.NewGuid(),
                Name = name,
                CreatedOn = DateTime.UtcNow,
                Players = playerNames.Select(n => new CribbagePlayer { Name = n }).ToList(),
                FirstDealerIndex = firstDealerIndex
            };
            await Save(game);
            return game;
        }

        public Task<CribbageGame> AddScore(Guid id, int playerIndex, int points)
        {
            return Update(id, game =>
            {
                if (game.IsFinished || points < 1 || points > MaxPointsPerEntry || playerIndex < 0 || playerIndex >= game.Players.Count)
                {
                    return false;
                }
                game.Entries.Add(new CribbageEntry { Kind = CribbageEntryKind.Score, PlayerIndex = playerIndex, Points = points, EnteredUtc = DateTime.UtcNow });
                return true;
            });
        }

        public Task<CribbageGame> NextDeal(Guid id)
        {
            return Update(id, game =>
            {
                if (game.IsFinished)
                {
                    return false;
                }
                game.Entries.Add(new CribbageEntry { Kind = CribbageEntryKind.NextDeal, EnteredUtc = DateTime.UtcNow });
                return true;
            });
        }

        /// <summary>Removes the last entry, whether it was a score or a new deal. Also un-finishes a won game.</summary>
        public Task<CribbageGame> Undo(Guid id)
        {
            return Update(id, game =>
            {
                if (game.Entries.Count == 0)
                {
                    return false;
                }
                game.Entries.RemoveAt(game.Entries.Count - 1);
                return true;
            });
        }

        private async Task<CribbageGame> Update(Guid id, Func<CribbageGame, bool> change)
        {
            var game = await GetGame(id);
            if (change(game))
            {
                await Save(game);
            }
            return game;
        }

        private Task Save(CribbageGame game)
        {
            game.LastModified = DateTime.UtcNow;
            return _gameState.SaveGame(GameType.Cribbage, game.Id.ToString(), Converter<CribbageGame>.ToJson(game));
        }
    }
}
