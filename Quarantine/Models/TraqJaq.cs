﻿using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class TraqJaq
    {
        public Guid Id { get; set; }
        public List<Medication> Medications { get; set; }
        public List<Milk> Pumps { get; set; }
        public List<Diaper> DiaperChanges { get; set; }
        public List<Milk> Feeds { get; set; }
    }
}
