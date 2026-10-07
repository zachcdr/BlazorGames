using System;
using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Diaper
    {
        public int Id { get; set; }

        public DateTime ChangeTimePst => GetStartTimePst();

        public DateTime ChangeTimeUtc { get; set; }

        public List<DiaperType> DiaperTypes { get; set; }

        public string CreatedByUserName { get; set; }

        public string UpdatedByUserName { get; set; }

        public Chorer? Chorer { get; set; }

        private DateTime GetStartTimePst()
        {
            TimeZoneInfo destinationTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(ChangeTimeUtc, destinationTimeZone);
        }
    }
}
