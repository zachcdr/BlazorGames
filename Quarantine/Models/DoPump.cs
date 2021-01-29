using Quarantine.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class DoPump
    {
        [Range(1, 500)]
        [Required]
        public int? Volume { get; set; }
        public PumpState PumpState { get; set; }
    }
}
