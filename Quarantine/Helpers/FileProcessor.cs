using System;
using System.Collections.Generic;
using System.IO;

namespace Quarantine.Helpers
{
    public static class FileProcessor
    {
        #region Public Methods
        public static string ReadFile(string file)
        {
            try
            {
                using (StreamReader reader = new StreamReader(file))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (Exception ex)
            {

            }

            return string.Empty;
        }

        public static void WriteFile(string contents, string location)
        {
            try
            {
                File.WriteAllText(location, contents);
            }
            catch (Exception ex)
            {

            }
        }

        public static List<string> GetFiles(string location)
        {
            DirectoryInfo d = new DirectoryInfo(location);//Assuming Test is your Folder
            FileInfo[] Files = d.GetFiles(); //Getting Text files
            var files = new List<string>();
            foreach (FileInfo file in Files)
            {
                var f = file.Name.Replace(".json", "");
                files.Add(f);
            }

            return files;
        }

        #endregion
    }
}
