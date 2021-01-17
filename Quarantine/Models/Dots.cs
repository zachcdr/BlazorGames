using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Models
{
    public class Dots : Game
    {
        public Dots()
        {
            GameType = GameType.Dots;
        }
        public List<DotType> DotTypes { get; set; }
        public List<GolfGroup> Groups { get; set; }
        public GolfRoundType GolfRoundType { get; set; }
    }
}
