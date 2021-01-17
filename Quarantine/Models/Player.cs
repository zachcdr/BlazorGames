using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class Player
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(25)]
        public string Name { get; set; }
        public bool IsAdmin { get; set; }
    }
}
