using Quarantine.Models.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Quarantine.Interfaces
{
    public interface IHandleRetreivingGames
    {
        Task<IList<string>> GetGames(GameType gameType);
    }
}
