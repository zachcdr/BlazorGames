using System.Collections.Generic;
using System.IO;
using System.Linq;
using Quarantine.Helpers;

namespace Quarantine.Models
{
    public static class CourseSelection
    {
        // courses.json lives next to the app on the server; without it, games just have no course info.
        public static List<Course> Courses => File.Exists(Path.Combine(Directory.GetCurrentDirectory(), "courses.json"))
            ? Converter<List<Course>>.FromJson(FileProcessor.ReadFile(Directory.GetCurrentDirectory(), "courses.json"))
            : new List<Course>();

        public static Course SelectCourse(string courseName)
        {
            return Courses.FirstOrDefault((Course c) => c.Name == courseName);
        }
    }
}
