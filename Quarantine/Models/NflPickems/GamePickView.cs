using System;

namespace Quarantine.Models.NflPickems
{
    public class GamePickView
    {
        public int GameId { get; set; }
        public DateTime GameTimeUtc { get; set; }
        public TeamView AwayTeam { get; set; }
        public TeamView HomeTeam { get; set; }
        public int PickedId { get; set; }
        public bool? IsWinner { get; set; }
        public int TieBreaker { get; set; }
    }
}
