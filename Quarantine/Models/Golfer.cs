using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Golfer : Player
    {
        public List<Hole> Holes { get; set; }
        public bool IsVisible { get; set; }
    }
}
