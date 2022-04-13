using Quarantine.Models.Enums;
using System.Collections.Generic;

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
        public NineType? NineType { get; set; }
    }
}
