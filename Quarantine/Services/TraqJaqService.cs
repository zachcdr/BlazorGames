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
    public class TraqJaqService
    {
        private readonly IHandleGameState _gameState;
        private TraqJaq _traqJaq;
        private List<TraqTypeView> _traqViews = new List<TraqTypeView>();
        private MilkSessionView _pumps;
        private MilkSessionView _feeds;

        public bool IsLoaded;
        public MilkSessionView Pumps { get => _pumps; }
        public MilkSessionView Feeds { get => _feeds; }

        public List<TraqTypeView> TraqTypeViews { get => _traqViews; }
        public string UserName { get; set; }
        public bool RefreshView { get; set; }

        public TraqJaqService(IHandleGameState gameState, Guid? id)
        {
            _gameState = gameState;

            ((TraqType[])Enum.GetValues(typeof(TraqType))).ToList()
                .ForEach(traqType => _traqViews.Add(new TraqTypeView() { TraqType = traqType }));

            if (id == null)
            {
                throw new KeyNotFoundException();
            }
            else
            {
                Load((Guid)id);
            }
        }

        private async void Load(Guid id)
        {
            while (true)
            {
                var gameResponse = await _gameState.LoadGame(GameType.TraqJaq, id);

                var traqJaq = Converter<TraqJaq>.FromJson(gameResponse);

                if (_traqJaq == null || _traqJaq.LastUpdatedUtc < traqJaq?.LastUpdatedUtc)
                {
                    _traqJaq = traqJaq;

                    FreshPumps();
                    FreshFeeds();

                    if (IsLoaded)
                    {
                        RefreshView = true;
                    }

                    IsLoaded = true;
                }

                await Task.Run(() => Thread.Sleep(5000));
            }
        }

        private async Task Save()
        {
            _traqJaq.LastUpdatedUtc = DateTime.UtcNow;

            await _gameState.SaveGame(GameType.TraqJaq, _traqJaq.Id, Converter<TraqJaq>.ToJson(_traqJaq));
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

            _pumps = new MilkSessionView(_traqJaq.Pumps, (DateTime)startDate, TraqType.Pump);
        }

        public void FreshFeeds(DateTime? startDate = null)
        {
            if (startDate == null)
            {
                startDate = GetCurrentPstDate(DateTime.UtcNow);
            }

            _feeds = new MilkSessionView(_traqJaq.Feeds, (DateTime)startDate, TraqType.Feed);
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
            }
        }

        public List<Medication> GetMedications()
        {
            return _traqJaq.Medications;
        }

        public DiaperChangeView GetDiaperChanges(int? limit = null)
        {
            return new DiaperChangeView()
            {
                TotalDiaperChanges = _traqJaq.DiaperChanges.Count,
                DiaperChanges = limit == null ? _traqJaq.DiaperChanges.OrderByDescending(p => p.ChangeTimeUtc).ToList()
                                      : _traqJaq.DiaperChanges.OrderByDescending(p => p.ChangeTimeUtc).Take((int)limit).ToList()
            };
        }

        public async Task UpdateMedicine(MedicationType medicationType)
        {
            _traqJaq.Medications.Single(med => med.MedicationType == medicationType).TimeTaken = DateTime.UtcNow;

            await Save();
        }

        public async Task UpdatePump(HandleMilk pump)
        {
            if (pump.MilkState == MilkState.Start)
            {
                _traqJaq.Pumps.Add(new Milk() { StartTimeUtc = DateTime.UtcNow, CreatedByUserName = UserName });
            }
            else
            {
                var pumpToUpdate = _traqJaq.Pumps.Single(p => p.EndTimeUtc == null);

                pumpToUpdate.EndTimeUtc = DateTime.UtcNow;
                pumpToUpdate.Volume = pump.Volume;
                pumpToUpdate.UpdatedByUserName = UserName;
            }

            _pumps = new MilkSessionView(_traqJaq.Pumps, GetCurrentPstDate(DateTime.UtcNow), TraqType.Pump);

            await Save();
        }

        public async Task DiaperChange(Diaper diaperChange)
        {
            diaperChange.CreatedByUserName = UserName;

            _traqJaq.DiaperChanges.Add(diaperChange);

            await Save();
        }

        public async Task Feed(HandleMilk feed)
        {
            if (feed.MilkState == MilkState.Start)
            {
                _traqJaq.Feeds.Add(new Milk() { StartTimeUtc = DateTime.UtcNow, CreatedByUserName = UserName });
            }
            else
            {
                var feedToUpdate = _traqJaq.Feeds.Single(p => p.EndTimeUtc == null);

                feedToUpdate.EndTimeUtc = DateTime.UtcNow;
                feedToUpdate.Volume = feed.Volume;
                feedToUpdate.UpdatedByUserName = UserName;
                feedToUpdate.Chorer = feed.Chorer;
            }

            _feeds = new MilkSessionView(_traqJaq.Feeds, GetCurrentPstDate(DateTime.UtcNow), TraqType.Feed);

            await Save();
        }
    }
}
