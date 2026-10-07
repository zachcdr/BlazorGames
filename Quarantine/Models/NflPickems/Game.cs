using System;

namespace Quarantine.Models.NflPickems
{
    public class Game
    {
        public int Id { get; set; }
        public int Week { get; set; }
        public Opponent HomeTeam { get; set; }
        public Opponent AwayTeam { get; set; }
        public int? WinningTeamId => GetWinningTeamId();
        public DateTime GameTimeUtc { get; set; }

        private int? GetWinningTeamId()
        {
            if (HomeTeam.Score == AwayTeam.Score)
            {
                return null;
            }
            return HomeTeam.Score > AwayTeam.Score ? HomeTeam.TeamId : AwayTeam.TeamId;
        }
    }
}
