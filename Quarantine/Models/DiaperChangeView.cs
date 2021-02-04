using Quarantine.ExtensionMethods;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class DiaperChangeView : Session
    {
        public DiaperChangeView(IEnumerable<Diaper> diapers, DateTime dateToDisplay)
        {
            if (diapers == null)
            {
                throw new ArgumentNullException();
            }

            SessionDate = dateToDisplay.Date;
            Total = diapers.Count();
            IsMaxDate = !(diapers.Any(diaper => diaper.ChangeTimePst >= SessionDate.AddDays(1)));
            IsMinDate = !(diapers.Any(diaper => diaper.ChangeTimePst < SessionDate));
            Stats = diapers.GroupBy(diaper => diaper.Chorer)
                                    .Select(group => new ChorerSessionStat()
                                    {
                                        UserName = group.First().Chorer?.GetDescription() ?? "Unknown",
                                        Total = group.Count()
                                    });
            DailyChanges = diapers.Where(diaper => diaper.ChangeTimePst.Date == SessionDate).OrderByDescending(diaper => diaper.ChangeTimePst);
        }
        public IEnumerable<Diaper> DailyChanges { get; private set; }
    }
}
