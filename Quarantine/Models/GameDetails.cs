using Quarantine.Models.Enums;
using System;

namespace Quarantine.Models
{
    public class GameDetails
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public GameState GameState { get; set; }
        public GameType GameType { get; set; }
    }
}
