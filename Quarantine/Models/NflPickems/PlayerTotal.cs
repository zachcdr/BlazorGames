namespace Quarantine.Models.NflPickems
{
    /// <summary>One player's season record, as stored in the totals snapshot.</summary>
    public class PlayerTotal
    {
        public int PlayerId { get; set; }
        public string Name { get; set; }
        public int Wins { get; set; }

        /// <summary>Same as PlayerPickView.TieBreaker; only used to order players with the same wins.</summary>
        public int TieBreaker { get; set; }
    }
}
