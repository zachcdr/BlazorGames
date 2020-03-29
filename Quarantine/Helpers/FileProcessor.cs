using System;
using System.Collections.Generic;
using System.IO;

namespace Quarantine.Helpers
{
    public static class FileProcessor
    {
        #region Public Methods
        public static string ReadFile(string path, string file)
        {
            DirectoryCheck(path);

            using (StreamReader reader = new StreamReader($"{path}/{file}"))
            {
                return reader.ReadToEnd();
            }
        }

        public static void WriteFile(string contents, string path, string file)
        {
            DirectoryCheck(path);

            File.WriteAllText($"{path}/{file}", contents);
        }

        public static List<string> GetFiles(string path)
        {
            DirectoryCheck(path);

            DirectoryInfo d = new DirectoryInfo(path);
            FileInfo[] Files = d.GetFiles();
            var files = new List<string>();
            foreach (FileInfo file in Files)
            {
                var f = file.Name.Replace(".json", "");
                files.Add(f);
            }

            return files;
        }
        #endregion

        private static void DirectoryCheck(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }
    }
}
