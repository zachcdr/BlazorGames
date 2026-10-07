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
            services.AddServerSideBlazor();

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
            services.AddScoped<NflCommissionerSession>();

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
                endpoints.MapFallbackToPage("/_Host");
            });
        }
    }
}
