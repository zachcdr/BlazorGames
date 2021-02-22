using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Quarantine.Models
{
    public class Traqer
    {
        public string Title { get; set; }
        public string Description { get; set; }
        [JsonIgnore]
        public List<Medication> Medications { get; set; } = new List<Medication>();
        [JsonIgnore]
        public List<Milk> Pumps { get; set; } = new List<Milk>();
        [JsonIgnore]
        public List<Diaper> DiaperChanges { get; set; } = new List<Diaper>();
        [JsonIgnore]
        public List<Milk> Feeds { get; set; } = new List<Milk>();
        public DateTime LastUpdatedUtc { get; set; }
    }
}
