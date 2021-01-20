using System.Collections.Generic;

namespace Quarantine.Models
{
    public class CardGame : Game
    {
        public IList<Card> Deck { get; set; }
        public IList<Drinker> Players { get; set; }
    }
}
