using Newtonsoft.Json;

namespace Quarantine.Helpers
{
    public class Converter<T>
    {
        public static T FromJson(string json) => JsonConvert.DeserializeObject<T>(json, Converter.Settings);

        public static string ToJson(T toSerialize) => JsonConvert.SerializeObject(toSerialize, Converter.Settings);
    }

    internal class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            // Replace lists a constructor pre-fills instead of appending to them. Without this, every load of a
            // Ride The Bus game added a fresh 52-card deck on top of the saved one, so duplicate cards got dealt.
            ObjectCreationHandling = ObjectCreationHandling.Replace,
            DateParseHandling = DateParseHandling.None,
            DateTimeZoneHandling = DateTimeZoneHandling.Unspecified
        };
    }
}
