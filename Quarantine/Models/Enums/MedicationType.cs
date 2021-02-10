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
        Miralax,
        PreNatal,
        [Description("Vitamin D")]
        VitaminD,
        [Description("Sunflower Lecithin")]
        SunflowerLecithin,
        [Description("Gas Reliever")]
        GasReliever
    }
}
