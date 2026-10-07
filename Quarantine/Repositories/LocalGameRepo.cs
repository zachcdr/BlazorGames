using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;

namespace Quarantine.Repositories
{
    public class LocalGameRepo : IHandleGameState, IHandleRetreivingGames
    {
        public async Task<string> LoadGame(GameType gameType, string gameFile)
        {
            string path = $"C:/Quarantine/Games/{gameType}";
            string file = gameFile + ".json";
            return await Task.Run(() => FileProcessor.ReadFile(path, file));
        }

        public async Task SaveGame(GameType gameType, string gameGuid, string game)
        {
            string path = $"C:/Quarantine/Games/{gameType}";
            string file = gameGuid + ".json";
            await Task.Run(delegate
            {
                FileProcessor.WriteFile(game, path, file);
            });
        }

        public async Task<IList<string>> GetGames(GameType gameType)
        {
            List<string> games = new List<string>();
            foreach (string item in await Task.Run(() => FileProcessor.GetFiles($"C:/Quarantine/Games/{gameType}/")))
            {
                List<string> list = games;
                list.Add(await LoadGame(gameType, item));
            }
            return games;
        }
    }
}
