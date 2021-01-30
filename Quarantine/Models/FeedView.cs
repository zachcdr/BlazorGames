using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class FeedView
    {
        public List<Feed> Feeds { get; set; }
        public int TotalFeeds { get; set; }
        public int DailyVolume { get => GetDailyVolume(); }

        private int GetDailyVolume()
        {
            return Feeds.Where(f => f.IsDaily).Sum(f => f.Volume == null ? 0 : (int)f.Volume);
        }
    }
}
