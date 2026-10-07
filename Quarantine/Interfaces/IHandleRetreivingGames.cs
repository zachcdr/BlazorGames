using System.Collections.Generic;
using System.Threading.Tasks;
using Quarantine.Models.Enums;

namespace Quarantine.Interfaces
{
    public interface IHandleRetreivingGames
    {
        Task<IList<string>> GetGames(GameType gameType);
    }
}
