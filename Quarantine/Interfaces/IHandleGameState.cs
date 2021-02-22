using Quarantine.Models;
using Quarantine.Models.Enums;
using System;
using System.Threading.Tasks;

namespace Quarantine.Interfaces
{
    public interface IHandleGameState
    {
        Task<string> LoadGame(GameType gameType, string gameFile);
        Task SaveGame(GameType gameType, string gameFile, string game);
    }
}
