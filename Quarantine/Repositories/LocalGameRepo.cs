using System.Collections.Generic;
using System.IO;
using System.Linq;
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
                // File names can contain "/" (e.g. "2026/picks/5/10"), so create any sub-folders first.
                Directory.CreateDirectory(Path.GetDirectoryName(Path.Combine(path, file)));
                FileProcessor.WriteFile(game, path, file);
            });
        }

        public async Task<IList<string>> ListGameFiles(GameType gameType, string prefix)
        {
            string root = $"C:/Quarantine/Games/{gameType}/";
            return await Task.Run(() =>
            {
                if (!Directory.Exists(root))
                {
                    return new List<string>();
                }
                return (IList<string>)Directory.GetFiles(root, "*.json", SearchOption.AllDirectories)
                    .Select(f => Path.GetRelativePath(root, f).Replace('\\', '/'))
                    .Select(f => f.Substring(0, f.Length - ".json".Length))
                    .Where(f => f.StartsWith(prefix))
                    .ToList();
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
