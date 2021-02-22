using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Quarantine.Services
{
    public class TraqerService
    {
        private readonly IHandleGameState _gameState;
        private Traqer _traqer;
        private List<TraqTypeView> _traqViews = new List<TraqTypeView>();
        private MilkSessionView _pumps;
        private MilkSessionView _feeds;
        private DiaperChangeView _diapers;

        public bool IsLoaded;
        public MilkSessionView Pumps { get => _pumps; }
        public MilkSessionView Feeds { get => _feeds; }
        public DiaperChangeView Diapers { get => _diapers; }
        public List<TraqTypeView> TraqTypeViews { get => _traqViews; }
        public string Title => _traqer?.Title;
        public string Description => _traqer?.Description;
        public string UserName { get; set; }
        public bool RefreshView { get; set; }

        public TraqerService(IHandleGameState gameState, GameType gameType)
        {
            _gameState = gameState;

            ((TraqType[])Enum.GetValues(typeof(TraqType))).ToList()
                .ForEach(traqType => _traqViews.Add(new TraqTypeView() { TraqType = traqType }));

            Load(gameType);
        }

        private async void Load(GameType gameType)
        {
            while (true)
            {
                var gameResponse = await _gameState.LoadGame(gameType, "main");

                var traqer = Converter<Traqer>.FromJson(gameResponse);

                if (_traqer == null || _traqer.LastUpdatedUtc < traqer?.LastUpdatedUtc)
                {
                    _traqer = traqer;

                    if (IsLoaded)
                    {
                        RefreshView = true;
                    }

                    IsLoaded = true;

                    LoadFeeds();
                    LoadPumps();
                    LoadDiapers();
                    LoadMedications();
                }

                await Task.Run(() => Thread.Sleep(5000));
            }
        }

        private async void LoadFeeds()
        {
            var feeds = await _gameState.LoadGame(GameType.TraqJaq, "feeds");

            _traqer.Feeds = Converter<List<Milk>>.FromJson(feeds);

            FreshFeeds();
        }

        private async void LoadPumps()
        {
            var pumps = await _gameState.LoadGame(GameType.TraqJaq, "pumps");

            _traqer.Pumps = Converter<List<Milk>>.FromJson(pumps);

            FreshPumps();
        }

        private async void LoadDiapers()
        {
            var diaperchanges = await _gameState.LoadGame(GameType.TraqJaq, "diaperchanges");
            _traqer.DiaperChanges = Converter<List<Diaper>>.FromJson(diaperchanges);

            FreshDiapers();
        }

        private async void LoadMedications()
        {
            var medications = await _gameState.LoadGame(GameType.TraqJaq, "medications");
            _traqer.Medications = Converter<List<Medication>>.FromJson(medications);
        }

        private async Task Save(string file, string data)
        {
            _traqer.LastUpdatedUtc = DateTime.UtcNow;

            await _gameState.SaveGame(GameType.TraqJaq, "main", Converter<Traqer>.ToJson(_traqer));

            await _gameState.SaveGame(GameType.TraqJaq, file, data);
        }

        private DateTime GetCurrentPstDate(DateTime utcDate)
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");

            return TimeZoneInfo.ConvertTimeFromUtc(utcDate, zone).Date;
        }

        public void FreshPumps(DateTime? startDate = null)
        {
            if (startDate == null)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }

            _pumps = new MilkSessionView(_traqer.Pumps, (DateTime)startDate, TraqType.Pump);
        }

        public void FreshFeeds(DateTime? startDate = null)
        {
            if (startDate == null)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }

            _feeds = new MilkSessionView(_traqer.Feeds, (DateTime)startDate, TraqType.Feed);
        }

        public void FreshDiapers(DateTime? startDate = null)
        {
            if (startDate == null)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }

            _diapers = new DiaperChangeView(_traqer.DiaperChanges, (DateTime)startDate);
        }

        public async Task Loading()
        {
            while (!IsLoaded)
            {
                await Task.Run(() => Thread.Sleep(100));
            }
        }

        public void ToggleTraq(TraqType traqType)
        {
            _traqViews.ForEach(tv => tv.IsVisible = false);
            _traqViews.Single(tv => tv.TraqType == traqType).IsVisible = true;

            switch (traqType)
            {
                case TraqType.Feed:
                    FreshFeeds();
                    break;
                case TraqType.Pump:
                    FreshPumps();
                    break;
                case TraqType.Diaper:
                    FreshDiapers();
                    break;
            }
        }

        public List<Medication> GetMedications()
        {
            return _traqer.Medications;
        }

        public async Task UpdateMedicine(MedicationType medicationType)
        {
            _traqer.Medications.Single(med => med.MedicationType == medicationType).TimeTaken = DateTime.UtcNow;

            await Save("medications", Converter<List<Medication>>.ToJson(_traqer.Medications));
        }

        public async Task UpdatePump(HandleMilk pump)
        {
            if (pump.MilkState == MilkState.Start)
            {
                _traqer.Pumps.Add(new Milk() { StartTimeUtc = DateTime.UtcNow, CreatedByUserName = UserName });
            }
            else
            {
                var pumpToUpdate = _traqer.Pumps.Single(p => p.EndTimeUtc == null);

                pumpToUpdate.EndTimeUtc = DateTime.UtcNow;
                pumpToUpdate.Volume = pump.Volume;
                pumpToUpdate.UpdatedByUserName = UserName;
                pumpToUpdate.IsPumpAndDump = pump.IsPumpAndDump;
            }

            _pumps = new MilkSessionView(_traqer.Pumps, GetCurrentPstDate(DateTime.UtcNow), TraqType.Pump);


            await Save("pumps", Converter<List<Milk>>.ToJson(_traqer.Pumps));
        }

        public async Task DiaperChange(Diaper diaperChange)
        {
            diaperChange.CreatedByUserName = UserName;

            _traqer.DiaperChanges.Add(diaperChange);

            _diapers = new DiaperChangeView(_traqer.DiaperChanges, GetCurrentPstDate(DateTime.UtcNow));

            await Save("diaperchanges", Converter<List<Diaper>>.ToJson(_traqer.DiaperChanges));
        }

        public async Task Feed(HandleMilk feed)
        {
            if (feed.MilkState == MilkState.Start)
            {
                _traqer.Feeds.Add(new Milk() { StartTimeUtc = DateTime.UtcNow, CreatedByUserName = UserName });
            }
            else
            {
                var feedToUpdate = _traqer.Feeds.Single(p => p.EndTimeUtc == null);

                feedToUpdate.EndTimeUtc = DateTime.UtcNow;
                feedToUpdate.Volume = feed.Volume;
                feedToUpdate.UpdatedByUserName = UserName;
                feedToUpdate.Chorer = feed.Chorer;
            }

            _feeds = new MilkSessionView(_traqer.Feeds, GetCurrentPstDate(DateTime.UtcNow), TraqType.Feed);

            await Save("feeds", Converter<List<Milk>>.ToJson(_traqer.Feeds));
        }
    }
}
