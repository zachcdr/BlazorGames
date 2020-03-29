using System.ComponentModel.DataAnnotations;

namespace Quarantine.Models
{
    public class InitiateGame
    {
        [Required]
        public string PlayerName { get; set; }
        [Required]
        public string GameName { get; set; }
    }
}
