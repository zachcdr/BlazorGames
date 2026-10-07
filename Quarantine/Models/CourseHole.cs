using System.Collections.Generic;

namespace Quarantine.Models
{
    public class CourseHole
    {
        public int Number { get; set; }

        public int Par { get; set; }

        public int Handicap { get; set; }

        public List<Tee> Tees { get; set; }
    }
}
