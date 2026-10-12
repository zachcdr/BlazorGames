using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models.Cribbage
{
    /// <summary>
    /// A cribbage game scored with physical cards. Only the entries are stored ("Zach +8", "next deal");
    /// totals, peg positions, the dealer and the winner are all worked out from them, so undo is just
    /// removing the last entry.
    /// </summary>
    public class CribbageGame
    {
        public const int WinningScore = 121;

        /// <summary>Finishing below this is a skunk.</summary>
        public const int SkunkLine = 91;

        /// <summary>Finishing below this is a double skunk.</summary>
        public const int DoubleSkunkLine = 61;

        public const int MaxPlayers = 3;

        public Guid Id { get; set; }
        public string Name { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime LastModified { get; set; }
        public List<CribbagePlayer> Players { get; set; } = new List<CribbagePlayer>();
        public int FirstDealerIndex { get; set; }
        public List<CribbageEntry> Entries { get; set; } = new List<CribbageEntry>();

        /// <summary>1 for the first deal, going up each time the deal moves on.</summary>
        public int DealNumber => 1 + Entries.Count(e => e.Kind == CribbageEntryKind.NextDeal);

        public int DealerIndex => (FirstDealerIndex + DealNumber - 1) % Players.Count;

        /// <summary>Front peg: the player's score, capped at 121.</summary>
        public int Total(int playerIndex)
        {
            return Math.Min(WinningScore, Scores(playerIndex).Sum(e => e.Points));
        }

        /// <summary>Back peg: where the front peg was before the player's last score.</summary>
        public int BackPeg(int playerIndex)
        {
            var last = Scores(playerIndex).LastOrDefault();
            return last == null ? 0 : Math.Min(WinningScore, Scores(playerIndex).Sum(e => e.Points) - last.Points);
        }

        public CribbageEntry LastScore(int playerIndex)
        {
            return Scores(playerIndex).LastOrDefault();
        }

        /// <summary>The first player to reach 121. Scoring stops there, so there is only ever one.</summary>
        public int? WinnerIndex
        {
            get
            {
                var running = new int[Players.Count];
                foreach (var entry in Entries.Where(e => e.Kind == CribbageEntryKind.Score))
                {
                    running[entry.PlayerIndex] += entry.Points;
                    if (running[entry.PlayerIndex] >= WinningScore)
                    {
                        return entry.PlayerIndex;
                    }
                }
                return null;
            }
        }

        public bool IsFinished => WinnerIndex.HasValue;

        /// <summary>"Double skunk", "Skunk", or null, for a player who lost.</summary>
        public string SkunkFor(int playerIndex)
        {
            if (!IsFinished || WinnerIndex == playerIndex)
            {
                return null;
            }
            var total = Total(playerIndex);
            return total < DoubleSkunkLine ? "Double skunk" : total < SkunkLine ? "Skunk" : null;
        }

        private IEnumerable<CribbageEntry> Scores(int playerIndex)
        {
            return Entries.Where(e => e.Kind == CribbageEntryKind.Score && e.PlayerIndex == playerIndex);
        }
    }

    public class CribbagePlayer
    {
        public string Name { get; set; }
    }

    public enum CribbageEntryKind
    {
        Score,
        NextDeal
    }

    public class CribbageEntry
    {
        public CribbageEntryKind Kind { get; set; }
        public int PlayerIndex { get; set; }
        public int Points { get; set; }
        public DateTime EnteredUtc { get; set; }
    }
}
