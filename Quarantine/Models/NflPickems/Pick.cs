namespace Quarantine.Models.NflPickems
{
    public class Pick
    {
        public int PlayerId { get; set; }
        public int GameId { get; set; }
        public int TeamId { get; set; }
        public int TieBreaker { get; set; }
    }
}
