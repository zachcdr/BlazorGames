using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;

namespace Quarantine.Repositories
{
    /// <summary>
    /// Stores each game's state as a JSON blob. The container name is the GameType in lower case
    /// (e.g. "nflpickems"), and the blob name is "{gameFile}.json".
    /// </summary>
    public class AzureGameRepo : IHandleGameState, IHandleRetreivingGames
    {
        private readonly BlobServiceClient _blobServiceClient;

        public AzureGameRepo(IOptions<ApplicationSettings> settings)
        {
            _blobServiceClient = new BlobServiceClient(settings.Value.BlobStorageConnectionString);
        }

        public async Task<string> LoadGame(GameType gameType, string gameFile)
        {
            var localPath = "./gamedata/";
            Directory.CreateDirectory(localPath);
            var fileName = gameFile + ".json";
            var downloadFilePath = Path.Combine(localPath, $"{Guid.NewGuid()}-{fileName}");

            var containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());
            var blobClient = containerClient.GetBlobClient(fileName);

            var download = (await blobClient.DownloadAsync()).Value;
            using (var fs = File.OpenWrite(downloadFilePath))
            {
                await download.Content.CopyToAsync(fs);
            }

            string result;
            using (var reader = new StreamReader(downloadFilePath))
            {
                result = reader.ReadToEnd();
            }

            File.Delete(downloadFilePath);
            return result;
        }

        public async Task SaveGame(GameType gameType, string gamePath, string game)
        {
            var localPath = "./gamedata/";
            Directory.CreateDirectory(localPath);
            var fileName = gamePath + ".json";
            var localFilePath = Path.Combine(localPath, $"{Guid.NewGuid()}-{fileName}");

            await File.WriteAllTextAsync(localFilePath, game);

            var containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());
            var blobClient = containerClient.GetBlobClient(fileName);

            using (var uploadFileStream = File.OpenRead(localFilePath))
            {
                await blobClient.UploadAsync(uploadFileStream, overwrite: true);
            }

            File.Delete(localFilePath);
        }

        public async Task<IList<string>> GetGames(GameType gameType)
        {
            var games = new List<string>();
            var containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());

            await foreach (var blobItem in containerClient.GetBlobsAsync())
            {
                games.Add(await LoadGame(gameType, blobItem.Name.Replace(".json", "")));
            }

            return games;
        }
    }
}
