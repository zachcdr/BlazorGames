using System.Text.Json;

namespace Quarantine.Helpers
{
    public static class Converter<T>
    {
        public static T FromJson(string json) => JsonSerializer.Deserialize<T>(json, Converter.Settings);
        public static string ToJson(T toSerialize) => JsonSerializer.Serialize(toSerialize, Converter.Settings);
    }

    static class Converter
    {
        public static readonly JsonSerializerOptions Settings = new JsonSerializerOptions()
        {
            WriteIndented = true,
            IgnoreNullValues = true
        };
    }
}