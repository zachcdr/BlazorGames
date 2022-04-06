using System.ComponentModel;

namespace Quarantine.Models.Enums
{
    public enum DotType
    {
        Hogan,
        Arnie,
        [Description("Sandy Save")]
        SandySave,
        Birdie,
        [Description("Win The Hole")]
        WinTheHole,
        Pulley,
        Chippie,
        [Description("KP (Par 3s)")]
        ClosestToPin,
        Bingo,
        Bango,
        Bongo
    }
}
