using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.NflPickems;

namespace Quarantine.Interfaces
{
    public interface INflScheduleService
    {
        Task<List<Game>> GetSchedule();
        Task SaveSchedule(List<Game> games);
    }
}
