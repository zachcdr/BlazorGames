using Quarantine.Models;
using System;
using System.Threading.Tasks;

namespace Quarantine.Interfaces
{
    public interface IHandleGameState
    {
        Task<string> LoadGame(Guid gameGuid);
        Task SaveGame(Guid gameGuid, string game);
    }
}
