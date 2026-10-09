using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.Enums;

namespace Quarantine.Interfaces
{
    public interface IHandleGameState
    {
        Task<string> LoadGame(GameType gameType, string gameFile);
        Task SaveGame(GameType gameType, string gameFile, string game);

        /// <summary>Names (without ".json") of every saved file that starts with the prefix, e.g. "2026/picks/".</summary>
        Task<IList<string>> ListGameFiles(GameType gameType, string prefix);
    }
}
