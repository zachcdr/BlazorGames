using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class InitiateDots : InitiateGame
    {
        public GolfRoundType GolfRoundType { get; set; }

        public NineType? NineType { get; set; }

        public List<DotType> DotTypes { get; set; }

        public string CourseName { get; set; }

        public string CourseTeeBox { get; set; }
    }
}
