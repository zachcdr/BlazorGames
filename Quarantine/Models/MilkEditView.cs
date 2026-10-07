using System.ComponentModel.DataAnnotations;
using Quarantine.Models.Enums;

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
