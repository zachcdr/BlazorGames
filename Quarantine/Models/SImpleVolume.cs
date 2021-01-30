using System;
using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class SimpleVolume
    {
        [Range(1, 500)]
        [Required]
        public int? Volume { get; set; }
    }
}
