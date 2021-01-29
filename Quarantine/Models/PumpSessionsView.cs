using System.Collections.Generic;

namespace Quarantine.Models
{
    public class PumpSessionsView
    {
        public List<Pump> Pumps { get; set; }
        public int TotalPumps { get; set; }
    }
}
