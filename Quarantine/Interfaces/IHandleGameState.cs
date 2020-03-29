using Quarantine.Models;
using Quarantine.Models.Enums;
using System;
using System.Threading.Tasks;

namespace Quarantine.Interfaces
{
    public interface IHandleGameState
    {
        Task<string> LoadGame(GameType gameType, Guid gameGuid);
        Task SaveGame(GameType gameType, Guid gameGuid, string game);
    }
}
