﻿using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class RideTheBus : Game
    {
        public RideTheBus()
        {
            Players = new List<Player>();
            Deck = GetDeck();
        }
        public IList<Card> Bus { get; set; }
        public RideTheBusRounds Round { get; set; }

        private IList<Card> GetDeck()
        {
            var deck = new List<Card>();

            foreach (Suit suit in (Suit[])Enum.GetValues(typeof(Suit)))
            {
                foreach (Value value in (Value[])Enum.GetValues(typeof(Value)))
                {
                    deck.Add(new Card()
                    {
                        Value = value,
                        Suit = suit,
                        IsVisible = false
                    });
                }
            }

            return deck;
        }
    }
}
