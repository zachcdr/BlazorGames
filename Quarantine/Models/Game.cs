using Quarantine.Models.Enums;
using System;

namespace Quarantine.Models
{
    public class Game
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
        public bool IsPasswordProtected { get { return !string.IsNullOrWhiteSpace(Password); } }
        public GameState GameState { get; set; }
        public GameType GameType { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime LastModified { get; set; }
    }
}
