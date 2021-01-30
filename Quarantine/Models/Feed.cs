using System;

namespace Quarantine.Models
{
    public class Feed
    {
        public int? Volume { get; set; }
        public DateTime FeedTimeUtc { get; set; }
        public bool IsDaily { get => GetIsDaily(); }

        private bool GetIsDaily()
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");

            var dateOfStart = TimeZoneInfo.ConvertTimeFromUtc(FeedTimeUtc, zone).Date;

            if (dateOfStart == TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone).Date)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}
