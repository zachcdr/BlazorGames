using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Card
    {
        public Value Value { get; set; }

        public Suit Suit { get; set; }

        public bool IsVisible { get; set; }

        public string FileName => GetFileName();

        private string GetFileName()
        {
            string text = "";
            switch (Value)
            {
            case Value.Ace:
                text += "A";
                break;
            case Value.Two:
                text += "2";
                break;
            case Value.Three:
                text += "3";
                break;
            case Value.Four:
                text += "4";
                break;
            case Value.Five:
                text += "5";
                break;
            case Value.Six:
                text += "6";
                break;
            case Value.Seven:
                text += "7";
                break;
            case Value.Eight:
                text += "8";
                break;
            case Value.Nine:
                text += "9";
                break;
            case Value.Ten:
                text += "10";
                break;
            case Value.Jack:
                text += "J";
                break;
            case Value.Queen:
                text += "Q";
                break;
            case Value.King:
                text += "K";
                break;
            }
            switch (Suit)
            {
            case Suit.Club:
                text += "C";
                break;
            case Suit.Diamond:
                text += "D";
                break;
            case Suit.Heart:
                text += "H";
                break;
            case Suit.Spade:
                text += "S";
                break;
            }
            return text + ".png";
        }
    }
}
