using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflWinService
    {
        Task<List<PlayerPickView>> GetPlayerPickViews(int? week = null, int? playerId = null);
    }
}
