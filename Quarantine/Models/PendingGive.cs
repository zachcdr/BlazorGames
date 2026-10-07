namespace Quarantine.Models
{
    /// <summary>
    /// Drinks a player has earned the right to hand out but hasn't assigned yet:
    /// after a correct guess (rounds 1-4), or for a matching card on a bus "give" column.
    /// </summary>
    public class PendingGive
    {
        public int PlayerId { get; set; }

        public int Drinks { get; set; }

        /// <summary>True for a bus give card; false for a correct guess, which also ends the player's turn.</summary>
        public bool FromBus { get; set; }
    }
}
