using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Card
    {
        public Value Value { get; set; }
        public Suit Suit { get; set; }
        public bool IsVisible { get; set; }
        public string FileName { get => GetFileName(); }

        private string GetFileName()
        {
            var fileName = "";

            switch (Value)
            {
                case Value.Ace:
                    fileName += "A";
                    break;
                case Value.Two:
                    fileName += "2";
                    break;
                case Value.Three:
                    fileName += "3";
                    break;
                case Value.Four:
                    fileName += "4";
                    break;
                case Value.Five:
                    fileName += "5";
                    break;
                case Value.Six:
                    fileName += "6";
                    break;
                case Value.Seven:
                    fileName += "7";
                    break;
                case Value.Eight:
                    fileName += "8";
                    break;
                case Value.Nine:
                    fileName += "9";
                    break;
                case Value.Ten:
                    fileName += "10";
                    break;
                case Value.Jack:
                    fileName += "J";
                    break;
                case Value.Queen:
                    fileName += "Q";
                    break;
                case Value.King:
                    fileName += "K";
                    break;
            }

            switch (Suit)
            {
                case Suit.Club:
                    fileName += "C";
                    break;
                case Suit.Diamond:
                    fileName += "D";
                    break;
                case Suit.Heart:
                    fileName += "H";
                    break;
                case Suit.Spade:
                    fileName += "S";
                    break;
            }

            fileName += ".png";

            return fileName;
        }
    }
}
