using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class PumpSessionsView
    {
        public List<Pump> Pumps { get; set; }
        public int TotalPumps { get; set; }
        public int DailyVolume { get => GetDailyVolume(); }

        private int GetDailyVolume() 
        {
            return Pumps.Where(p => p.IsDaily).Sum(p => p.Volume == null ? 0 : (int)p.Volume);
        }
    }
}
