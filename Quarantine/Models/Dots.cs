using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Dots : Game
    {
        public List<DotType> DotTypes { get; set; }

        public List<GolfGroup> Groups { get; set; }

        public GolfRoundType GolfRoundType { get; set; }

        public NineType? NineType { get; set; }

        public Dots()
        {
            base.GameType = GameType.Dots;
        }
    }
}
