using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;

namespace Quarantine.Services
{
    public class TraqerService
    {
        private readonly IHandleGameState _gameState;

        private GameType _gameType;

        private Traqer _traqer;

        private List<TraqTypeView> _traqViews = new List<TraqTypeView>();

        private MilkSessionView _pumps;

        private MilkSessionView _feeds;

        private DiaperChangeView _diapers;

        public bool IsLoaded;

        public MilkSessionView Pumps => _pumps;

        public MilkSessionView Feeds => _feeds;

        public DiaperChangeView Diapers => _diapers;

        public List<TraqTypeView> TraqTypeViews => _traqViews;

        public string Title => _traqer?.Title;

        public string Description => _traqer?.Description;

        public string UserName { get; set; }

        public bool RefreshView { get; set; }

        public TraqerService(IHandleGameState gameState, GameType gameType)
        {
            _gameState = gameState;
            _gameType = gameType;
            ((TraqType[])Enum.GetValues(typeof(TraqType))).ToList().ForEach(delegate(TraqType traqType)
            {
                _traqViews.Add(new TraqTypeView
                {
                    TraqType = traqType
                });
            });
            Load(gameType);
        }

        private async void Load(GameType gameType)
        {
            while (true)
            {
                Traqer traqer = Converter<Traqer>.FromJson(await _gameState.LoadGame(gameType, "main"));
                // Only reload when the stored data is newer than what we already have.
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
                await Task.Run(delegate
                {
                    Thread.Sleep(5000);
                });
            }
        }

        private async void LoadFeeds()
        {
            string json = await _gameState.LoadGame(_gameType, "feeds");
            _traqer.Feeds = Converter<List<Milk>>.FromJson(json);
            FreshFeeds();
        }

        private async void LoadPumps()
        {
            string json = await _gameState.LoadGame(_gameType, "pumps");
            _traqer.Pumps = Converter<List<Milk>>.FromJson(json);
            FreshPumps();
        }

        private async void LoadDiapers()
        {
            string json = await _gameState.LoadGame(_gameType, "diaperchanges");
            _traqer.DiaperChanges = Converter<List<Diaper>>.FromJson(json);
            FreshDiapers();
        }

        private async void LoadMedications()
        {
            string json = await _gameState.LoadGame(_gameType, "medications");
            _traqer.Medications = Converter<List<Medication>>.FromJson(json);
        }

        private async Task Save(string file, string data)
        {
            _traqer.LastUpdatedUtc = DateTime.UtcNow;
            await _gameState.SaveGame(_gameType, "main", Converter<Traqer>.ToJson(_traqer));
            await _gameState.SaveGame(_gameType, file, data);
        }

        private DateTime GetCurrentPstDate(DateTime utcDate)
        {
            TimeZoneInfo destinationTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcDate, destinationTimeZone).Date;
        }

        public void FreshPumps(DateTime? startDate = null)
        {
            if (!startDate.HasValue)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }
            _pumps = new MilkSessionView(_traqer.Pumps, startDate.Value, TraqType.Pump);
        }

        public void FreshFeeds(DateTime? startDate = null)
        {
            if (!startDate.HasValue)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }
            _feeds = new MilkSessionView(_traqer.Feeds, startDate.Value, TraqType.Feed);
        }

        public void FreshDiapers(DateTime? startDate = null)
        {
            if (!startDate.HasValue)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }
            _diapers = new DiaperChangeView(_traqer.DiaperChanges, startDate.Value);
        }

        public async Task Loading()
        {
            while (!IsLoaded)
            {
                await Task.Run(delegate
                {
                    Thread.Sleep(100);
                });
            }
        }

        public void ToggleTraq(TraqType traqType)
        {
            _traqViews.ForEach(delegate(TraqTypeView tv)
            {
                tv.IsVisible = false;
            });
            _traqViews.Single((TraqTypeView tv) => tv.TraqType == traqType).IsVisible = true;
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
            _traqer.Medications.Single((Medication med) => med.MedicationType == medicationType).TimeTaken = DateTime.UtcNow;
            await Save("medications", Converter<List<Medication>>.ToJson(_traqer.Medications));
        }

        public async Task StartFinishSession(HandleMilk pump)
        {
            if (pump.MilkState == MilkState.Start)
            {
                if (_traqer.Pumps.Count > 0)
                {
                    _ = _traqer.Pumps.OrderByDescending((Milk f) => f.Id).First().Id + 1;
                }
                _traqer.Pumps.Add(new Milk
                {
                    StartTimeUtc = DateTime.UtcNow,
                    CreatedByUserName = UserName,
                    Id = _traqer.Pumps.Count + 1
                });
            }
            else
            {
                Milk milk = _traqer.Pumps.Single((Milk p) => !p.EndTimeUtc.HasValue);
                milk.EndTimeUtc = DateTime.UtcNow;
                milk.Volume = pump.Volume;
                milk.UpdatedByUserName = UserName;
                milk.IsPumpAndDump = pump.IsPumpAndDump;
            }
            _pumps = new MilkSessionView(_traqer.Pumps, GetCurrentPstDate(DateTime.UtcNow), TraqType.Pump);
            await Save("pumps", Converter<List<Milk>>.ToJson(_traqer.Pumps));
        }

        public async Task DiaperChange(Diaper diaperChange)
        {
            int id = 1;
            if (_traqer.DiaperChanges.Count > 0)
            {
                id = _traqer.DiaperChanges.OrderByDescending((Diaper f) => f.Id).First().Id + 1;
            }
            diaperChange.Id = id;
            diaperChange.CreatedByUserName = UserName;
            _traqer.DiaperChanges.Add(diaperChange);
            _diapers = new DiaperChangeView(_traqer.DiaperChanges, GetCurrentPstDate(DateTime.UtcNow));
            await Save("diaperchanges", Converter<List<Diaper>>.ToJson(_traqer.DiaperChanges));
        }

        public async Task Feed(HandleMilk feed)
        {
            if (feed.MilkState == MilkState.Start)
            {
                int id = 1;
                if (_traqer.Feeds.Count > 0)
                {
                    id = _traqer.Feeds.OrderByDescending((Milk f) => f.Id).First().Id + 1;
                }
                _traqer.Feeds.Add(new Milk
                {
                    StartTimeUtc = DateTime.UtcNow,
                    CreatedByUserName = UserName,
                    Id = id
                });
            }
            else
            {
                Milk milk = _traqer.Feeds.Single((Milk p) => !p.EndTimeUtc.HasValue);
                milk.EndTimeUtc = DateTime.UtcNow;
                milk.Volume = feed.Volume;
                milk.UpdatedByUserName = UserName;
                milk.Chorer = feed.Chorer;
            }
            _feeds = new MilkSessionView(_traqer.Feeds, GetCurrentPstDate(DateTime.UtcNow), TraqType.Feed);
            await Save("feeds", Converter<List<Milk>>.ToJson(_traqer.Feeds));
        }

        public async Task UpdateMilk(MilkEditView milkEditView)
        {
            switch (milkEditView.MilkType)
            {
            case MilkType.Pump:
            {
                Milk milk = _traqer.Pumps.Single((Milk p) => p.Id == milkEditView.Id);
                milk.Volume = milkEditView.Volume;
                milk.EndTimeUtc = milk.StartTimeUtc.AddMinutes(milkEditView.Duration.Value);
                _pumps = new MilkSessionView(_traqer.Pumps, GetCurrentPstDate(DateTime.UtcNow), TraqType.Pump);
                await Save("pumps", Converter<List<Milk>>.ToJson(_traqer.Pumps));
                break;
            }
            case MilkType.Feed:
            {
                Milk milk = _traqer.Feeds.Single((Milk p) => p.Id == milkEditView.Id);
                milk.Volume = milkEditView.Volume;
                milk.EndTimeUtc = milk.StartTimeUtc.AddMinutes(milkEditView.Duration.Value);
                _feeds = new MilkSessionView(_traqer.Feeds, GetCurrentPstDate(DateTime.UtcNow), TraqType.Feed);
                await Save("feeds", Converter<List<Milk>>.ToJson(_traqer.Feeds));
                break;
            }
            }
        }
    }
}
