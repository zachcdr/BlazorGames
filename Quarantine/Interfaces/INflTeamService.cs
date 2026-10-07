using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflTeamService
    {
        Task<List<Team>> GetTeams();
    }
}
