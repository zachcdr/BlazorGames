using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Quarantine.Models
{
    public class Course
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("holes")]
        public List<CourseHole> CourseHoles { get; set; }

        public string SelectedTees { get; private set; }

        public void SelectTees(string teeBox)
        {
            SelectedTees = teeBox;
        }

        public SelectedHole GetHole(int holeNumber)
        {
            CourseHole courseHole = CourseHoles.Single((CourseHole h) => h.Number == holeNumber);
            if (courseHole != null)
            {
                return new SelectedHole
                {
                    Par = courseHole.Par,
                    Handicap = courseHole.Handicap,
                    Yards = courseHole.Tees.Single((Tee t) => t.Color == SelectedTees).Yards
                };
            }
            return null;
        }
    }
}
