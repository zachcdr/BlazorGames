using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Quarantine.Repositories
{
	public class LocalGameRepo : IHandleGameState, IHandleRetreivingGames
	{
		#region Public methods
		public async Task<string> LoadGame(GameType gameType, string gameFile)
		{
			var path = $"C:/Quarantine/Games/{gameType}";
			var file = $"{gameFile}.json";

			return await Task.Run(() => FileProcessor.ReadFile(path, file));
		}

		public async Task SaveGame(GameType gameType, string gameGuid, string game)
		{
			var path = $"C:/Quarantine/Games/{gameType}";
			var file = $"{gameGuid}.json";

			await Task.Run(() => FileProcessor.WriteFile(game, path, file));
		}

		public async Task<IList<string>> GetGames(GameType gameType)
		{
			var games = new List<string>();

			var files = await Task.Run(() => FileProcessor.GetFiles($"C:/Quarantine/Games/{gameType}/"));

			foreach (var file in files)
			{
				games.Add(await LoadGame(gameType, file));
			}

			return games;
		}
		#endregion
	}
}