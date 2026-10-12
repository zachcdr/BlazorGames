using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflWinService
    {
        Task<List<PlayerPickView>> GetPlayerPickViews(int? week = null, int? playerId = null);

        /// <summary>Season standings from the saved snapshot (built on first use if it's missing).</summary>
        Task<List<PlayerTotal>> GetSeasonTotals();

        /// <summary>
        /// Recomputes the season standings from every pick and saves the snapshot. Call after anything that can change
        /// a final result: saving scores, or Chap changing picks on games that are already final.
        /// </summary>
        Task RefreshSeasonTotals();
    }
}
