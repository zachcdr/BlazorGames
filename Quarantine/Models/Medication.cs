using Quarantine.Models.Enums;
using System;

namespace Quarantine.Models
{
    public class Medication
    {
        public MedicationType MedicationType { get; set; }
        public string Quantity { get => GetQuantity(); }
        public DateTime TimeTaken { get; set; }
        public DateTime NextDose { get => GetNextDose(); }
        public bool IsEnabled { get; set; }

        private string GetQuantity()
        {
            var prettyQuantity = string.Empty;

            switch (MedicationType)
            {
                case MedicationType.Ibuprofen:
                    prettyQuantity = "3";
                    break;
                case MedicationType.Tylenol:
                    prettyQuantity = "2";
                    break;
                case MedicationType.Oxycodone:
                    prettyQuantity = "1-2";
                    break;
                case MedicationType.StoolSoftener:
                    prettyQuantity = "1-2";
                    break;
                case MedicationType.Miralax:
                    prettyQuantity = "Full Serving";
                    break;
                case MedicationType.PreNatal:
                    prettyQuantity = "4";
                    break;
                case MedicationType.VitaminD:
                    prettyQuantity = "1";
                    break;
                case MedicationType.SunflowerLecithin:
                    prettyQuantity = "1";
                    break;
            }

            return prettyQuantity;
        }

        private DateTime GetNextDose()
        {
            var newDate = Convert.ToDateTime(TimeTaken.ToString());

            switch (MedicationType)
            {
                case MedicationType.Ibuprofen:
                    newDate = newDate.AddHours(6);
                    break;
                case MedicationType.Tylenol:
                    newDate = newDate.AddHours(6);
                    break;
                case MedicationType.Oxycodone:
                    newDate = newDate.AddHours(4);
                    break;
                case MedicationType.StoolSoftener:
                    newDate = newDate.AddHours(24);
                    break;
                case MedicationType.Miralax:
                    newDate = newDate.AddHours(24);
                    break;
                case MedicationType.PreNatal:
                    newDate = newDate.AddHours(24);
                    break;
                case MedicationType.SunflowerLecithin:
                    newDate = newDate.AddHours(12);
                    break;
                case MedicationType.VitaminD:
                    newDate = newDate.AddHours(24);
                    break;
            }

            return newDate;
        }
    }
}
