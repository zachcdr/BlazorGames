namespace Quarantine.Services
{
    /// <summary>
    /// Per-circuit (per browser tab) flag set when Chap's password is entered, so the admin pick page
    /// can't bypass the pick locks just by typing its URL. Cleared after the overridden picks are saved.
    /// </summary>
    public class NflCommissionerSession
    {
        public bool IsUnlocked { get; set; }
    }
}
