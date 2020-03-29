﻿using Quarantine.Models.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class Player
    {
        public Player()
        {
            Cards = new List<Card>();
        }

        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public IList<Card> Cards { get; set; }
        public bool IsAdmin { get; set; }
        public PlayerState State { get; set; }
        public int Drinks { get; set; }
    }
}