namespace Quarantine.Models
{
    public class NflGameScore
    {
        public string AwayTeam { get; set; } = "";
        public int AwayScore { get; set; }
        public string HomeTeam { get; set; } = "";
        public int HomeScore { get; set; }
        public bool IsFinal { get; set; }
        public int? AwayTeamId { get; set; }
        public int? HomeTeamId { get; set; }
    }
}
