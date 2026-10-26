using System.Text.Json;
using System.Text.Json.Serialization;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Quarantine.Data;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Repositories;
using Quarantine.Services;

namespace Quarantine
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<ApplicationSettings>(Configuration);

            services.AddMvc().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.WriteIndented = true;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, true));
                options.JsonSerializerOptions.IgnoreNullValues = true;
            });
            services.AddRazorPages();
            // Phones drop the connection every time the app is backgrounded. Keep a dropped session around for
            // 10 minutes (default 3) so coming back reconnects to it instead of starting over.
            services.AddServerSideBlazor()
                .AddCircuitOptions(options => options.DisconnectedCircuitRetentionPeriod = System.TimeSpan.FromMinutes(10));

            services.AddSingleton<WeatherForecastService>();

            // Game state is stored as JSON blobs in Azure Storage.
            // (LocalGameRepo is an alternative that uses C:/Quarantine/Games on disk.)
            services.AddTransient<IHandleGameState, AzureGameRepo>();
            services.AddTransient<IHandleRetreivingGames, AzureGameRepo>();

            services.AddTransient<INflScheduleService, NflScheduleService>();
            services.AddTransient<INflTeamService, NflTeamService>();
            services.AddTransient<INflPlayerService, NflPlayerService>();
            services.AddTransient<INflPickService, NflPickService>();
            services.AddTransient<INflWinService, NflWinService>();
            services.AddScoped<NflPlayerSession>();
            services.AddTransient<CribbageService>();

            services.AddHttpClient<NflScoreService>();

            services.AddBlazoredLocalStorage(config =>
            {
                config.JsonSerializerOptions.WriteIndented = true;
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapBlazorHub();
                // Scrollfall is a separate static app built into wwwroot/scrollfall (see the Scrollfall repo's
                // `npm run publish:to`). Its own files are served by UseStaticFiles; this keeps the Blazor
                // fallback below from swallowing /scrollfall and /scrollfall/.
                endpoints.MapFallbackToFile("scrollfall/{**path}", "scrollfall/index.html");
                endpoints.MapFallbackToPage("/_Host");
            });
        }
    }
}
