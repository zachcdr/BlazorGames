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
        public List<Medication> Medications { get; set; }
        [JsonIgnore]
        public List<Milk> Pumps { get; set; }
        [JsonIgnore]
        public List<Diaper> DiaperChanges { get; set; }
        [JsonIgnore]
        public List<Milk> Feeds { get; set; }
        public DateTime LastUpdatedUtc { get; set; }
        public DateTime MedicineLastUpdatedUtc { get; set; }
        public DateTime PumpLastUpdatedUtc { get; set; }
        public DateTime FeedLastUpdatedUtc { get; set; }
        public DateTime DiaperLastUpdatedUtc { get; set; }
    }
}
