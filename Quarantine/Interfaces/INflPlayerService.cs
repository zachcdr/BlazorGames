using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflPlayerService
    {
        Task<List<Player>> GetPlayers();
        Task SavePlayerPassword(int playerId, string password);
    }
}
