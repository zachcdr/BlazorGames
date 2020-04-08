using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class InitiateGame
    {
        [Required]
        [MaxLength(25)]
        public string PlayerName { get; set; }
        [Required]
        [MaxLength(25)]
        public string GameName { get; set; }
        public string Password { get; set; }
    }
}
