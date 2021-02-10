using Quarantine.Models.Enums;
using System;

namespace Quarantine.Models
{
    public class Milk
    {
        public DateTime StartTimePst { get => GetStartTimePst(); }
        public DateTime StartTimeUtc { get; set; }
        public DateTime? EndTimeUtc { get; set; }
        public string Duration { get => GetDuration(); }
        public int? Volume { get; set; }
        public string CreatedByUserName { get; set; }
        public string UpdatedByUserName { get; set; }
        public Chorer? Chorer { get; set; }
        public bool? IsPumpAndDump { get; set; }

        public string GetDuration()
        {
            double duration = 0;

            if (EndTimeUtc == null)
            {
                duration = Math.Floor((Convert.ToDateTime(DateTime.UtcNow) - StartTimeUtc).Duration().TotalMinutes);
            }
            else
            {
                duration = Math.Floor((Convert.ToDateTime(EndTimeUtc) - StartTimeUtc).Duration().TotalMinutes);
            }

            var plural = duration == 1 ? "" : "s";

            return $"{duration} minute{plural}";
        }

        private DateTime GetStartTimePst()
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");

            return TimeZoneInfo.ConvertTimeFromUtc(StartTimeUtc, zone);
        }
    }
}
