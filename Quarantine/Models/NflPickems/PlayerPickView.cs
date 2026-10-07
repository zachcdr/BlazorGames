using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models.NflPickems
{
    public class PlayerPickView
    {
        public int Id { get; set; }
        public string Name { get; private set; }
        public string Password { get; private set; }
        public int Wins => Picks.Count(pick => pick.IsWinner.HasValue && pick.IsWinner.Value);
        public bool ArePicksVisible { get; set; }
        public List<GamePickView> Picks { get; set; } = new List<GamePickView>();

        /// <summary>
        /// Distance between the player's tie-breaker guess and the actual combined score.
        /// Lower is better; 5000 means no tie breaker was entered.
        /// </summary>
        public int TieBreaker => GetTieBreaker();

        public PlayerPickView(Player player, List<Team> teams, List<Game> games, List<Pick> picks)
        {
            Id = player.Id;
            Name = player.Name;
            Password = player.Password;

            games.ForEach(game =>
            {
                var pick = picks.SingleOrDefault(p => p.GameId == game.Id);
                var homeTeam = teams.Single(team => team.Id == game.HomeTeam.TeamId);
                var awayTeam = teams.Single(team => team.Id == game.AwayTeam.TeamId);

                Picks.Add(new GamePickView
                {
                    PickedId = pick?.TeamId ?? 0,
                    TieBreaker = pick?.TieBreaker ?? 0,
                    GameId = game.Id,
                    GameTimeUtc = game.GameTimeUtc,
                    HomeTeam = new TeamView { Id = homeTeam.Id, Name = homeTeam.Name, Score = game.HomeTeam.Score },
                    AwayTeam = new TeamView { Id = awayTeam.Id, Name = awayTeam.Name, Score = game.AwayTeam.Score },
                    IsWinner = IsWinner(game, pick)
                });
            });
        }

        private bool? IsWinner(Game game, Pick pick)
        {
            if (pick == null || !game.WinningTeamId.HasValue)
            {
                return null;
            }
            return game.WinningTeamId.Value == pick.TeamId;
        }

        private int GetTieBreaker()
        {
            var pickWithTieBreaker = Picks.FirstOrDefault(p => p.TieBreaker != 0);
            if (pickWithTieBreaker != null)
            {
                return Math.Abs(pickWithTieBreaker.AwayTeam.Score + pickWithTieBreaker.HomeTeam.Score - pickWithTieBreaker.TieBreaker);
            }
            return 5000;
        }
    }
}
