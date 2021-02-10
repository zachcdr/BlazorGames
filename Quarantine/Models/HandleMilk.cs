using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class HandleMilk : SimpleVolume
    {
        public MilkState MilkState { get; set; }
        public Chorer? Chorer { get; set; }
        public bool IsPumpAndDump { get; set; } 
    }
}
