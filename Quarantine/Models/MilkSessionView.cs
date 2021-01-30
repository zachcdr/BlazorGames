using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class MilkSessionView
    {
        public List<Milk> Milks { get; set; }
        public int Total { get; set; }
        public int DailyVolume { get => GetDailyVolume(); }

        private int GetDailyVolume() 
        {
            return Milks.Where(p => p.IsDaily).Sum(p => p.Volume == null ? 0 : (int)p.Volume);
        }
    }
}
