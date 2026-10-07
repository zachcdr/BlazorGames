using System;
using System.Collections.Generic;
using System.Linq;
using Quarantine.ExtensionMethods;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class DiaperChangeView : Session
    {
        public IEnumerable<Diaper> DailyChanges { get; private set; }

        public DiaperChangeView(IEnumerable<Diaper> diapers, DateTime dateToDisplay)
        {
            if (diapers == null)
            {
                throw new ArgumentNullException();
            }
            base.SessionDate = dateToDisplay.Date;
            base.Total = diapers.Count();
            base.IsMaxDate = !diapers.Any((Diaper diaper) => diaper.ChangeTimePst >= base.SessionDate.AddDays(1.0));
            base.IsMinDate = !diapers.Any((Diaper diaper) => diaper.ChangeTimePst < base.SessionDate);
            base.ChorerStats = (from diaper in diapers
                group diaper by diaper.Chorer).Select(delegate(IGrouping<Chorer?, Diaper> group)
            {
                ChorerSessionStat chorerSessionStat = new ChorerSessionStat();
                Chorer? chorer = group.First().Chorer;
                chorerSessionStat.UserName = (chorer.HasValue ? chorer.GetValueOrDefault().GetDescription() : null) ?? "Unknown";
                chorerSessionStat.Total = group.Count();
                return chorerSessionStat;
            });
            DailyChanges = from diaper in diapers
                where diaper.ChangeTimePst.Date == base.SessionDate
                orderby diaper.ChangeTimePst descending
                select diaper;
        }
    }
}
