using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Helpers
{
    /// <summary>
    /// When a pick can no longer be made or changed:
    ///  - games before that week's Sunday (Thursday, Friday, Saturday...) lock at their own kickoff;
    ///  - everything else locks at 10:00 AM Pacific on that week's Sunday (or at kickoff, if that's earlier);
    ///  - a week can't be picked at all until every game in it has a kickoff time entered.
    /// Chap's password is the only override.
    /// </summary>
    public static class NflPickLock
    {
        /// <summary>Chap. Entering this player's password bypasses every lock.</summary>
        public const int CommissionerPlayerId = 10;

        private const int SundayDeadlineHourPacific = 10;

        /// <summary>Kickoff times that haven't been entered yet are stored as 1/1/0001.</summary>
        public static bool IsScheduled(DateTime gameTimeUtc)
        {
            return gameTimeUtc.Year >= 2000;
        }

        /// <summary>A week only opens for picks once every game in it has a kickoff time.</summary>
        public static bool IsWeekScheduled(IEnumerable<DateTime> weekGameTimesUtc)
        {
            return weekGameTimesUtc.All(IsScheduled);
        }

        public static DateTime LockTimeUtc(DateTime gameTimeUtc, IEnumerable<DateTime> weekGameTimesUtc)
        {
            var weekTimes = weekGameTimesUtc.DefaultIfEmpty(gameTimeUtc).ToList();
            if (!IsScheduled(gameTimeUtc) || !IsWeekScheduled(weekTimes))
            {
                // Some kickoff time hasn't been entered yet: the whole week stays closed until it is.
                return DateTime.MinValue;
            }

            var deadline = SundayDeadlineUtc(weekTimes);
            return gameTimeUtc < deadline ? gameTimeUtc : deadline;
        }

        public static bool IsLocked(DateTime gameTimeUtc, IEnumerable<DateTime> weekGameTimesUtc)
        {
            return DateTime.UtcNow >= LockTimeUtc(gameTimeUtc, weekGameTimesUtc);
        }

        /// <summary>10:00 AM Pacific on the first Sunday on or after the week's first game.</summary>
        public static DateTime SundayDeadlineUtc(IEnumerable<DateTime> weekGameTimesUtc)
        {
            var pacific = PacificTimeZone();
            var firstGame = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(weekGameTimesUtc.Min(), DateTimeKind.Utc), pacific);
            var daysUntilSunday = ((int)DayOfWeek.Sunday - (int)firstGame.DayOfWeek + 7) % 7;
            var sunday = DateTime.SpecifyKind(firstGame.Date.AddDays(daysUntilSunday).AddHours(SundayDeadlineHourPacific), DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(sunday, pacific);
        }

        public static TimeZoneInfo PacificTimeZone()
        {
            foreach (var id in new[] { "Pacific Standard Time", "America/Los_Angeles" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(id);
                }
                catch (TimeZoneNotFoundException)
                {
                }
            }
            // Fallback without DST; only reached on a host with no time zone data.
            return TimeZoneInfo.CreateCustomTimeZone("Pacific", TimeSpan.FromHours(-8), "Pacific", "Pacific");
        }
    }
}
