using System;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Milk
    {
        public int Id { get; set; }

        public DateTime StartTimePst => GetStartTimePst();

        public DateTime StartTimeUtc { get; set; }

        public DateTime? EndTimeUtc { get; set; }

        public string Duration => string.Format("{0} minute{1}", DurationValue, (DurationValue == 1) ? "" : "s");

        public int DurationValue => GetDuration();

        public int? Volume { get; set; }

        public string CreatedByUserName { get; set; }

        public string UpdatedByUserName { get; set; }

        public Chorer? Chorer { get; set; }

        public bool? IsPumpAndDump { get; set; }

        public int GetDuration()
        {
            double num = 0.0;
            num = (EndTimeUtc.HasValue ? Math.Floor((Convert.ToDateTime(EndTimeUtc) - StartTimeUtc).Duration().TotalMinutes) : Math.Floor((Convert.ToDateTime(DateTime.UtcNow) - StartTimeUtc).Duration().TotalMinutes));
            return Convert.ToInt32(num);
        }

        private DateTime GetStartTimePst()
        {
            TimeZoneInfo destinationTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(StartTimeUtc, destinationTimeZone);
        }
    }
}
