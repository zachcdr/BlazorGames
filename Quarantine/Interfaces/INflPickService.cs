using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflPickService
    {
        /// <summary>Picks, optionally narrowed to one week and/or one player.</summary>
        Task<List<Pick>> GetPicks(int? week = null, int? playerId = null);
        Task SavePicks(List<Pick> picks);
    }
}
