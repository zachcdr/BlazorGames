using Quarantine.Models.Enums;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Drinker : Player
    {
        public Drinker()
        {
            Cards = new List<Card>();
        }

        public int Drinks { get; set; }
        public int TotalDrinks { get; set; }
        public IList<Card> Cards { get; set; }
        public PlayerState State { get; set; }
    }
}
