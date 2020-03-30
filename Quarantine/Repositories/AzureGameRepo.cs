using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Quarantine.Interfaces;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Quarantine.Repositories
{
    public class AzureGameRepo : IHandleGameState, IHandleRetreivingGames
    {
        private BlobServiceClient _blobServiceClient;
        private readonly string _connectionString = "CONNECTIONSTRING";

        public AzureGameRepo()
        {
            _blobServiceClient = new BlobServiceClient(_connectionString);
        }

        public async Task<string> LoadGame(GameType gameType, Guid gameGuid)
        {
            // Create a local file in the ./data/ directory for uploading and downloading
            string localPath = "./data/";
            var file = $"{gameGuid}.json";

            string localFilePath = Path.Combine(localPath, file);

            // Download the blob to a local file
            // Append the string "DOWNLOAD" before the .txt extension 
            // so you can compare the files in the data directory
            string downloadFilePath = localFilePath.Replace(".json", "DOWNLOAD.json");

            // Create the container and return a container client object
            BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());

            // Get a reference to a blob
            BlobClient blobClient = containerClient.GetBlobClient(file);
            // Download the blob's contents and save it to a file
            BlobDownloadInfo download = await blobClient.DownloadAsync();

            using (FileStream downloadFileStream = File.OpenWrite(downloadFilePath))
            {
                await download.Content.CopyToAsync(downloadFileStream);
                downloadFileStream.Close();
            }

            using (StreamReader reader = new StreamReader(downloadFilePath))
            {
                return reader.ReadToEnd();
            }
        }

        public async Task SaveGame(GameType gameType, Guid gameGuid, string game)
        {
            // Create a local file in the ./data/ directory for uploading and downloading
            string localPath = "./data/";
            var file = $"{gameGuid}.json";

            string localFilePath = Path.Combine(localPath, file);

            // Write text to the file
            await File.WriteAllTextAsync(localFilePath, game);

            // Create the container and return a container client object
            BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());

            // Get a reference to a blob
            BlobClient blobClient = containerClient.GetBlobClient(file);

            // Open the file and upload its data
            using FileStream uploadFileStream = File.OpenRead(localFilePath);
            try
            {
                await blobClient.UploadAsync(uploadFileStream, true);

            }
            catch (Exception ex)
            {

                throw;
            } 
            uploadFileStream.Close();
        }

        public async Task<IList<string>> GetGames(GameType gameType)
        {
            var games = new List<string>();

            // Create the container and return a container client object
            BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(gameType.ToString().ToLower());

            // List all blobs in the container
            await foreach (var blobItem in containerClient.GetBlobsAsync())
            {
                games.Add(await LoadGame(gameType, new Guid(blobItem.Name.Replace(".json", ""))));
            }

            return games;
        }
    }
}
