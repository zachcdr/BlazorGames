using Quarantine.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class MilkEditView
    {
        public int Id { get; set; }
        [Range(1, 500)]
        [Required]
        public int? Volume { get; set; }
        [Range(1, 500)]
        [Required]
        public int? Duration { get; set; }
        public MilkType MilkType { get; set; }
    }
}
