using Quarantine.Models.Enums;
using System;

namespace Quarantine.Models
{
    public class Milk
    {
        public int Id { get; set; }
        public DateTime StartTimePst { get => GetStartTimePst(); }
        public DateTime StartTimeUtc { get; set; }
        public DateTime? EndTimeUtc { get; set; }
        public string Duration { get => $"{DurationValue} minute{(DurationValue == 1 ? "" : "s")}"; }
        public int DurationValue { get => GetDuration(); }
        public int? Volume { get; set; }
        public string CreatedByUserName { get; set; }
        public string UpdatedByUserName { get; set; }
        public Chorer? Chorer { get; set; }
        public bool? IsPumpAndDump { get; set; }

        public int GetDuration()
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

            return Convert.ToInt32(duration);
        }

        private DateTime GetStartTimePst()
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");

            return TimeZoneInfo.ConvertTimeFromUtc(StartTimeUtc, zone);
        }
    }
}
