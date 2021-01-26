using System.ComponentModel;

namespace Quarantine.Models.Enums
{
    public enum MedicationType
    {
        Oxycodone,
        Tylenol,
        Ibuprofen,
        [Description("Stool Softener")]
        StoolSoftener,
        [Description("MiraLAX")]
        Miralax
    }
}
