using System;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Data
{
    public class WeatherForecastService
    {
        private static readonly string[] Summaries = new string[10] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };

        public Task<WeatherForecast[]> GetForecastAsync(DateTime startDate)
        {
            Random rng = new Random();
            return Task.FromResult((from index in Enumerable.Range(1, 5)
                select new WeatherForecast
                {
                    Date = startDate.AddDays(index),
                    TemperatureC = rng.Next(-20, 55),
                    Summary = Summaries[rng.Next(Summaries.Length)]
                }).ToArray());
        }
    }
}
