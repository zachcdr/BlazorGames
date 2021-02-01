using System;
using System.Collections.Generic;
using System.Linq;

namespace Quarantine.Models
{
    public class MilkSessionView
    {
        public MilkSessionView(IEnumerable<Milk> milks, DateTime dateToDisplay)
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
        }

        public IEnumerable<Milk> DailyMilks { get; private set; }
        public int Total { get; private set; }
        public int DailyVolume { get => GetDailyVolume(); }
        public DateTime SessionDate { get; private set; }
        public bool IsMaxDate { get; private set; }
        public bool IsMinDate { get; private set; }

        private int GetDailyVolume() 
        {
            return DailyMilks.Sum(p => p.Volume == null ? 0 : (int)p.Volume);
        }
    }
}
