using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Models
{
    public class Session
    {
        public int Total { get; set; }
        public DateTime SessionDate { get; set; }
        public bool IsMaxDate { get; set; }
        public bool IsMinDate { get; set; }
        public bool IsActiveSession { get; set; }
        public IEnumerable<ChorerSessionStat> Stats { get; set; }
    }
}
