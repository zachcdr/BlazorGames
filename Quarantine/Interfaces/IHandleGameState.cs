using System.Threading.Tasks;
using Quarantine.Models.Enums;

namespace Quarantine.Interfaces
{
    public interface IHandleGameState
    {
        Task<string> LoadGame(GameType gameType, string gameFile);
        Task SaveGame(GameType gameType, string gameFile, string game);
    }
}
