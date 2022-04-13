using Newtonsoft.Json;
using Quarantine.Helpers;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Quarantine.Models
{
    public static class CourseSelection
    {
        public static Course SelectCourse(string courseName)
        {
            return Courses.FirstOrDefault(c => c.Name == courseName);
        }

        public static List<Course> Courses => Converter<List<Course>>.FromJson(FileProcessor.ReadFile(Directory.GetCurrentDirectory(), "courses.json"));
    }

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
            var hole = CourseHoles.Single(h => h.Number == holeNumber);

            if (hole != null)
            {
                return new SelectedHole()
                {
                    Par = hole.Par,
                    Handicap = hole.Handicap,
                    Yards = hole.Tees.Single(t => t.Color == SelectedTees).Yards
                };
            }

            return null;
        }
    }

    public class CourseHole
    {
        public int Number { get; set; }
        public int Par { get; set; }
        public int Handicap { get; set; }
        public List<Tee> Tees { get; set; }
    }

    public class Tee
    {
        public string Color { get; set; }
        public int Yards { get; set; }
    }

    public class SelectedHole
    {
        public int Par { get; set; }
        public int Handicap { get; set; }
        public int Yards { get; set; }
    }
}
