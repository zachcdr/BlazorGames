using System.Collections.Generic;
using System.IO;

namespace Quarantine.Helpers
{
    public static class FileProcessor
    {
        public static string ReadFile(string path, string file)
        {
            DirectoryCheck(path);
            using StreamReader streamReader = new StreamReader(path + "/" + file);
            return streamReader.ReadToEnd();
        }

        public static void WriteFile(string contents, string path, string file)
        {
            DirectoryCheck(path);
            File.WriteAllText(path + "/" + file, contents);
        }

        public static List<string> GetFiles(string path)
        {
            DirectoryCheck(path);
            DirectoryInfo directoryInfo = new DirectoryInfo(path);
            FileInfo[] files = directoryInfo.GetFiles();
            List<string> list = new List<string>();
            FileInfo[] array = files;
            foreach (FileInfo fileInfo in array)
            {
                string item = fileInfo.Name.Replace(".json", "");
                list.Add(item);
            }
            return list;
        }

        private static void DirectoryCheck(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }
    }
}
