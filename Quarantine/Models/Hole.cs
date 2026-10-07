using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Hole
    {
        public int Id { get; set; }

        public int Score { get; set; }

        public List<DotType> Dots { get; set; }

        public Hole()
        {
            Dots = new List<DotType>();
        }
    }
}
