using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Drinker : Player
    {
        public int Drinks { get; set; }

        public int TotalDrinks { get; set; }

        public IList<Card> Cards { get; set; }

        public PlayerState State { get; set; }

        public Drinker()
        {
            Cards = new List<Card>();
        }
    }
}
