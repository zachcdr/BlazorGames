using System;
using System.Collections.Generic;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class GolfGroup
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public List<Golfer> Golfers { get; set; }

        public bool IsVisible { get; set; }

        public int CurrentHole { get; set; }

        public string CourseName { get; set; }

        public string CourseTeeBox { get; set; }

        public GolfGroup(NineType? nineType)
        {
            Id = Guid.NewGuid();
            Golfers = new List<Golfer>();
            CurrentHole = ((nineType != NineType.Back) ? 1 : 10);
        }

        public void AddPlayer(Player player, GolfRoundType golfRoundType, NineType? nineType)
        {
            Golfer golfer = new Golfer
            {
                Id = Golfers.Count + 1,
                Name = player.Name,
                IsAdmin = (Golfers.Count == 0),
                Holes = new List<Hole>()
            };
            if (golfRoundType == GolfRoundType.Eighteen || nineType == NineType.Front)
            {
                for (int i = 1; i <= (int)golfRoundType; i++)
                {
                    golfer.Holes.Add(new Hole
                    {
                        Id = i
                    });
                }
            }
            else
            {
                for (int j = 10; j <= 18; j++)
                {
                    golfer.Holes.Add(new Hole
                    {
                        Id = j
                    });
                }
            }
            Golfers.Add(golfer);
        }
    }
}
