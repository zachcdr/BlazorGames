using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Models
{
    public class DiaperChangeView
    {
        public int TotalDiaperChanges { get; set; }
        public List<Diaper> DiaperChanges { get; set; }
    }
}
