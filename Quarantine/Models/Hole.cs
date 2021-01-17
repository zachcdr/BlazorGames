using Quarantine.Models.Enums;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Hole
    {
        public Hole()
        {
            Dots = new List<DotType>();
        }

        public int Id { get; set; }
        public int Score { get; set; }
        public List<DotType> Dots { get; set; }
    }
}
