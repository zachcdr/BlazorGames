using System;

namespace Quarantine.Models
{
    public class Pump
    {
        public DateTime StartTimeUtc { get; set; }
        public DateTime? EndTimeUtc { get; set; }
        public string Duration { get => GetDuration(); }

        public string GetDuration()
        {
            if (EndTimeUtc == null)
            {
                return null;
            }

            return $"{Math.Floor((Convert.ToDateTime(EndTimeUtc) - StartTimeUtc).Duration().TotalMinutes)} minutes";
        }
    }
}
