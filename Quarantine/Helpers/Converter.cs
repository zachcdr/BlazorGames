using Newtonsoft.Json;

namespace Quarantine.Helpers
{
    public class Converter<T>
    {
        public static T FromJson(string json) => JsonConvert.DeserializeObject<T>(json, Converter.Settings);
        public static string ToJson(T toSerialize) => JsonConvert.SerializeObject(toSerialize, Converter.Settings);
    }

    class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            DateTimeZoneHandling = DateTimeZoneHandling.Unspecified
        };
    }
}
