using System;

namespace Quarantine.Data
{
    public class WeatherForecast
    {
        public DateTime Date { get; set; }

        public int TemperatureC { get; set; }

        public int TemperatureF => 32 + (int)((double)TemperatureC / 0.5556);

        public string Summary { get; set; }
    }
}
