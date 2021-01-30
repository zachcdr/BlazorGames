using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class DoPump : SimpleVolume
    {
        public PumpState PumpState { get; set; }
    }
}
