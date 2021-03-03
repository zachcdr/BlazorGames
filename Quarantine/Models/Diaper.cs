using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Diaper
    {
        public int Id { get; set; }
        public DateTime ChangeTimePst { get => GetStartTimePst(); }
        public DateTime ChangeTimeUtc { get; set; }
        public List<DiaperType> DiaperTypes { get; set; }
        public string CreatedByUserName { get; set; }
        public string UpdatedByUserName { get; set; }
        public Chorer? Chorer { get; set; }

        private DateTime GetStartTimePst()
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");

            return TimeZoneInfo.ConvertTimeFromUtc(ChangeTimeUtc, zone);
        }
    }
}
