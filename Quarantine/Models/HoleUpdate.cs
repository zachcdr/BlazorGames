using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class HoleUpdate
    {
        public int CurrentHole { get; set; }
        public List<Golfer> Golfers { get; set; }
        public Guid GroupId { get; set; }
        public bool CompleteGame { get; set; }
    }
}
