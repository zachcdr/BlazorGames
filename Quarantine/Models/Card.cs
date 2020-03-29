using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Card
    {
        public Value Value { get; set; }
        public Suit Suit { get; set; }
        public bool IsVisible { get; set; }
    }
}
