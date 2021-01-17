using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;

namespace Quarantine.Models
{
    public class GolfGroup
    {
        public GolfGroup()
        {
            Id = Guid.NewGuid();
            Golfers = new List<Golfer>();
            CurrentHole = 1;
        }

        public Guid Id { get; set; }
        public string Name { get; set; }
        public List<Golfer> Golfers { get; set; }
        public bool IsVisible { get; set; }
        public int CurrentHole { get; set; }
        public void AddPlayer(Player player, GolfRoundType golfRoundType)
        {
            var golfer = new Golfer()
            {
                Id = Golfers.Count + 1,
                Name = player.Name,
                IsAdmin = Golfers.Count == 0,
                Holes = new List<Hole>()
            };

            int iterator = 1;
            while (iterator <= (int)golfRoundType)
            {
                golfer.Holes.Add(new Hole()
                {
                    Id = iterator
                });

                iterator++;
            }

            Golfers.Add(golfer);
        }
    }
}
