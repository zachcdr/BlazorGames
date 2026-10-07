using System;
using Quarantine.Models.Enums;

namespace Quarantine.Models
{
    public class Medication
    {
        public MedicationType MedicationType { get; set; }

        public string Quantity => GetQuantity();

        public DateTime TimeTaken { get; set; }

        public DateTime NextDose => GetNextDose();

        public bool IsEnabled { get; set; }

        private string GetQuantity()
        {
            string result = string.Empty;
            switch (MedicationType)
            {
            case MedicationType.Ibuprofen:
                result = "1";
                break;
            case MedicationType.Tylenol:
                result = "2";
                break;
            case MedicationType.Oxycodone:
                result = "1-2";
                break;
            case MedicationType.StoolSoftener:
                result = "1-3";
                break;
            case MedicationType.Miralax:
                result = "Full Serving";
                break;
            case MedicationType.PreNatal:
                result = "4";
                break;
            case MedicationType.VitaminD:
                result = "1";
                break;
            case MedicationType.SunflowerLecithin:
                result = "1";
                break;
            case MedicationType.GasReliever:
                result = "0.2 ml";
                break;
            case MedicationType.Antibiotics:
                result = "1";
                break;
            }
            return result;
        }

        private DateTime GetNextDose()
        {
            DateTime result = Convert.ToDateTime(TimeTaken.ToString());
            switch (MedicationType)
            {
            case MedicationType.Ibuprofen:
                result = result.AddHours(6.0);
                break;
            case MedicationType.Tylenol:
                result = result.AddHours(6.0);
                break;
            case MedicationType.Oxycodone:
                result = result.AddHours(4.0);
                break;
            case MedicationType.StoolSoftener:
                result = result.AddHours(24.0);
                break;
            case MedicationType.Miralax:
                result = result.AddHours(24.0);
                break;
            case MedicationType.PreNatal:
                result = result.AddHours(24.0);
                break;
            case MedicationType.SunflowerLecithin:
                result = result.AddHours(12.0);
                break;
            case MedicationType.VitaminD:
                result = result.AddHours(24.0);
                break;
            case MedicationType.GasReliever:
                result = result.AddHours(4.0);
                break;
            case MedicationType.Antibiotics:
                result = result.AddHours(12.0);
                break;
            }
            return result;
        }
    }
}
