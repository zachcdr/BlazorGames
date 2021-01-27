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

        public bool IsLoaded;
        public List<TraqTypeView> TraqTypeViews { get => _traqViews; }

        public TraqJaqService(IHandleGameState gameState, Guid? id)
        {
            _gameState = gameState;

            ((TraqType[])Enum.GetValues(typeof(TraqType))).ToList()
                .ForEach(traqType => _traqViews.Add(new TraqTypeView() { TraqType = traqType }));

            if (id == null)
            {
                _traqJaq = new TraqJaq()
                {
                    Medications = GenerateMedications(),
                    Id = Guid.NewGuid()
                };

                IsLoaded = true;
            }
            else
            {
                Load((Guid)id);
            }
        }

        private async void Load(Guid id)
        {
            var gameResponse = await _gameState.LoadGame(GameType.TraqJaq, id);

            _traqJaq = Converter<TraqJaq>.FromJson(gameResponse);

            IsLoaded = true;
        }

        private async Task Save()
        {
            await _gameState.SaveGame(GameType.TraqJaq, _traqJaq.Id, Converter<TraqJaq>.ToJson(_traqJaq));
        }

        private List<Medication> GenerateMedications()
        {
            var medications = new List<Medication>();


            ((MedicationType[])Enum.GetValues(typeof(MedicationType))).ToList()
                .ForEach(med => medications.Add(new Medication() { MedicationType = med, TimeTaken = DateTime.UtcNow }));

            return medications;
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
        }

        public List<Medication> GetMedications()
        {
            return _traqJaq.Medications;
        }

        public List<Pump> GetPumpSessions()
        {
            return _traqJaq.Pumps.OrderByDescending(p => p.StartTimeUtc).ToList();
        }

        public async Task UpdateMedicine(MedicationType medicationType)
        {
            _traqJaq.Medications.Single(med => med.MedicationType == medicationType).TimeTaken = DateTime.UtcNow;

            await Save();
        }

        public async Task UpdatePump(PumpState pumpState)
        {
            if (pumpState == PumpState.Start)
            {
                _traqJaq.Pumps.Add(new Pump() { StartTimeUtc = DateTime.UtcNow });
            }
            else
            {
                _traqJaq.Pumps.Single(p => p.EndTimeUtc == null).EndTimeUtc = DateTime.UtcNow;
            }

            await Save();
        }
    }
}
