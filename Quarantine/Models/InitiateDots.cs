using Quarantine.Models.Enums;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class InitiateDots : InitiateGame
    {
        public GolfRoundType GolfRoundType { get; set; }
        public List<DotType> DotTypes { get; set; }
    }
}
