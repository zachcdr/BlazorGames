using System;
using System.Collections.Generic;
using System.Linq;
using Quarantine.ExtensionMethods;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class MilkSessionView : Session
    {
        public IEnumerable<Milk> DailyMilks { get; private set; }

        public int DailyVolume => GetDailyVolume();

        public int DailyMinutes => GetDailyMunites();

        public TraqType TraqType { get; private set; }

        public MilkSessionView(IEnumerable<Milk> milks, DateTime dateToDisplay, TraqType traqType)
        {
            if (milks == null)
            {
                throw new ArgumentNullException();
            }
            base.SessionDate = dateToDisplay.Date;
            DailyMilks = from milk in milks
                where milk.StartTimePst.Date == base.SessionDate
                orderby milk.StartTimePst descending
                select milk;
            base.Total = milks.Count();
            base.IsMaxDate = !milks.Any((Milk milk) => milk.StartTimePst >= base.SessionDate.AddDays(1.0));
            base.IsMinDate = !milks.Any((Milk milk) => milk.StartTimePst < base.SessionDate);
            base.IsActiveSession = milks.Any((Milk milk) => !milk.EndTimeUtc.HasValue);
            base.ChorerStats = (from milk in milks
                group milk by milk.Chorer).Select(delegate(IGrouping<Chorer?, Milk> group)
            {
                ChorerSessionStat chorerSessionStat = new ChorerSessionStat();
                Chorer? chorer = group.First().Chorer;
                chorerSessionStat.UserName = (chorer.HasValue ? chorer.GetValueOrDefault().GetDescription() : null) ?? "Unknown";
                chorerSessionStat.Total = group.Count();
                return chorerSessionStat;
            });
            base.HourlyVolumeStats = from milk in milks
                where milk.Volume.HasValue
                select milk into @group
                select new ValueDateSessionStat
                {
                    Date = @group.StartTimePst,
                    Value = @group.Volume.Value
                };
            base.DailyVolumeStats = from milk in milks
                where milk.Volume.HasValue
                group milk by milk.StartTimePst.Date into @group
                select new ValueDateSessionStat
                {
                    Date = @group.First().StartTimePst,
                    Value = @group.Sum((Milk g) => g.Volume.Value)
                };
            TraqType = traqType;
        }

        private int GetDailyVolume()
        {
            return DailyMilks.Sum((Milk p) => p.Volume.HasValue ? p.Volume.Value : 0);
        }

        private int GetDailyMunites()
        {
            return DailyMilks.Sum((Milk d) => d.DurationValue);
        }
    }
}
