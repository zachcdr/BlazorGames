using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflPickService
    {
        /// <summary>
        /// Picks, optionally narrowed to one week and/or one player. The week filter only narrows the per-player
        /// files: legacy picks have no week, so callers still need to match picks to that week's games.
        /// </summary>
        Task<List<Pick>> GetPicks(int? week = null, int? playerId = null);
        Task SavePicks(List<Pick> picks);
    }
}
