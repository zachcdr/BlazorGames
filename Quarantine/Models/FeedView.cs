using System.Collections.Generic;

namespace Quarantine.Models
{
    public class FeedView
    {
        public List<Feed> Feeds { get; set; }
        public int TotalFeeds { get; set; }
    }
}
