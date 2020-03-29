using Quarantine.Helpers;
using Quarantine.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Repositories
{
	public class LocalGameRepo : IHandleGameState, IHandleRetreivingGames
	{
		#region Public methods
		public async Task<string> LoadGame(Guid gameGuid)
		{
			return await Task.Run(() => FileProcessor.ReadFile($"C:/Users/zpfahl/Documents/Games/{gameGuid}.json"));
		}

		public async Task SaveGame(Guid gameGuid, string game)
		{
			await Task.Run(() => FileProcessor.WriteFile(game, $"C:/Users/zpfahl/Documents/Games/{gameGuid}.json"));
		}

		public async Task<IList<string>> GetGames()
		{
			var games = new List<string>();

			var files = await Task.Run(() => FileProcessor.GetFiles($"C:/Users/zpfahl/Documents/Games"));

			foreach (var file in files)
			{
				games.Add(await LoadGame(new Guid(file)));
			}

			return games;
		}
		#endregion
	}
}