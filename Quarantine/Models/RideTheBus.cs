using System;
using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class RideTheBus : CardGame
    {
        public IList<Card> Bus { get; set; }

        public RideTheBusRounds Round { get; set; }

        /// <summary>Drinks waiting for a player to pick who takes them.</summary>
        public IList<PendingGive> PendingGives { get; set; }

        public RideTheBus()
        {
            base.Players = new List<Drinker>();
            base.Deck = GetDeck();
            Bus = new List<Card>();
            PendingGives = new List<PendingGive>();
            base.CreatedOn = DateTime.UtcNow;
            base.GameType = GameType.RideTheBus;
        }

        public void Restart()
        {
            base.Deck = GetDeck();
            Bus = new List<Card>();
            PendingGives = new List<PendingGive>();
            foreach (Drinker player in base.Players)
            {
                player.Cards = new List<Card>();
                player.Drinks = 0;
            }
        }

        private IList<Card> GetDeck()
        {
            List<Card> list = new List<Card>();
            Suit[] array = (Suit[])Enum.GetValues(typeof(Suit));
            foreach (Suit suit in array)
            {
                Value[] array2 = (Value[])Enum.GetValues(typeof(Value));
                foreach (Value value in array2)
                {
                    list.Add(new Card
                    {
                        Value = value,
                        Suit = suit,
                        IsVisible = false
                    });
                }
            }
            return list;
        }
    }
}
