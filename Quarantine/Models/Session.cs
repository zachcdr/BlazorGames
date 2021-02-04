using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Session
    {
        public int Total { get; set; }
        public DateTime SessionDate { get; set; }
        public bool IsMaxDate { get; set; }
        public bool IsMinDate { get; set; }
        public bool IsActiveSession { get; set; }
        public IEnumerable<ChorerSessionStat> ChorerStats { get; set; }
        public IEnumerable<ValueDateSessionStat> VolumeStats { get; set; }
    }
}
