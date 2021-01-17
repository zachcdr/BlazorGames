using System.Text.Json;
using System.Text.Json.Serialization;

namespace Quarantine.Helpers
{
    public static class Converter<T>
    {
        public static T FromJson(string json) => JsonSerializer.Deserialize<T>(json, Converter.GetSettings());
        public static string ToJson(T toSerialize) => JsonSerializer.Serialize(toSerialize, Converter.GetSettings());
    }

    static class Converter
    {
        public static JsonSerializerOptions GetSettings()
        {
            var settings = new JsonSerializerOptions()
            {
                WriteIndented = true,
                IgnoreNullValues = true
            };

            settings.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));

            return settings;
        }
    }
}