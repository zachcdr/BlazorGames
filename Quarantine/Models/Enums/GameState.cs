using System.ComponentModel;

namespace Quarantine.Models.Enums
{
    public enum GameState
    {
        New,
        [Description("In Progress")]
        InProgress,
        Complete
    }
}
