using Quarantine.ExtensionMethods;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class MilkSessionView : Session
    {
        public MilkSessionView(IEnumerable<Milk> milks, DateTime dateToDisplay, TraqType traqType)
        {
            if (milks == null)
            {
                throw new ArgumentNullException();
            }

            SessionDate = dateToDisplay.Date;
            DailyMilks = milks.Where(milk => milk.StartTimePst.Date == SessionDate).OrderByDescending(milk => milk.StartTimePst);
            Total = milks.Count();
            IsMaxDate = !(milks.Any(milk => milk.StartTimePst >= SessionDate.AddDays(1)));
            IsMinDate = !(milks.Any(milk => milk.StartTimePst < SessionDate));
            IsActiveSession = milks.Any(milk => milk.EndTimeUtc == null);
            ChorerStats = milks.GroupBy(milk => milk.Chorer)
                                    .Select(group => new ChorerSessionStat()
                                    {
                                        UserName = group.First().Chorer?.GetDescription() ?? "Unknown",
                                        Total = group.Count()
                                    });
            HourlyVolumeStats = milks.Where(milk => milk.Volume != null).Select(group => new ValueDateSessionStat()
            {
                Date = group.StartTimePst,
                Value = (int)group.Volume
            });
            DailyVolumeStats = milks.Where(milk => milk.Volume != null)
                .GroupBy(milk => milk.StartTimePst.Date).Select(group => new ValueDateSessionStat()
                {
                    Date = group.First().StartTimePst,
                    Value = group.Sum(g => (int)g.Volume)
                });
            TraqType = traqType;
        }

        public IEnumerable<Milk> DailyMilks { get; private set; }
        public int DailyVolume { get => GetDailyVolume(); }
        public TraqType TraqType { get; private set; }

        private int GetDailyVolume()
        {
            return DailyMilks.Sum(p => p.Volume == null ? 0 : (int)p.Volume);
        }
    }
}
