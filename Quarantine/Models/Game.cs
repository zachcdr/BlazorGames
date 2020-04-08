﻿using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class Game
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
        public bool IsPasswordProtected { get { return !string.IsNullOrWhiteSpace(Password); } }
        public IList<Player> Players { get; set; }
        public IList<Card> Deck { get; set; }
        public GameState GameState { get; set; }
        public GameType GameType { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime LastModified { get; set; }
    }
}
