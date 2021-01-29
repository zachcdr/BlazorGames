using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Diaper
    {   
        public DateTime ChangeTimeUtc { get; set; }
        public List<DiaperType> DiaperTypes { get; set; }
    }
}
