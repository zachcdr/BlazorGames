using System.Linq;

namespace Quarantine.Models
{
    public class GolferScoreView
    {
        public int TotalDots { get; private set; }

        public string Name { get; private set; }

        public int RoundScore { get; private set; }

        public GolferScoreView(Golfer golfer)
        {
            Name = golfer.Name;
            TotalDots = golfer.Holes.Sum((Hole h) => h.Dots.Count);
            RoundScore = golfer.Holes.Sum((Hole h) => h.Score);
        }
    }
}
