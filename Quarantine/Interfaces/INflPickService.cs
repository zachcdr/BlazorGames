using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflPickService
    {
        Task<List<Pick>> GetPicks();
        Task SavePicks(List<Pick> picks);
    }
}
