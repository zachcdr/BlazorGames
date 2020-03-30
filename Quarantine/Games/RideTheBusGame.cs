using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Games
{
    public class RideTheBusGame
    {
        private readonly IHandleGameState _gameState;
        private readonly int _playerHand = 4;
        private readonly List<string> _redOrBlackOptions = new List<string>() { "Red", "Black" };
        private readonly List<string> _higherOrLowerOptions = new List<string>() { "Higher", "Lower" };
        private readonly List<string> _insideOrOutsideOptions = new List<string>() { "Inside", "Outside" };
        private readonly List<string> _suitOptions = new List<string>() { "Heart", "Club", "Diamond", "Spade" };
        private Random _random = new Random();

        public RideTheBus Game;

        public RideTheBusGame(IHandleGameState gameState, Guid? id = null)
        {
            _gameState = gameState;

            if (id == null)
            {
                Game = new RideTheBus();
                Game.Id = Guid.NewGuid();
                Game.GameState = GameState.New;
                Game.CreatedOn = DateTime.Now;
            }
            else
            {
                Load((Guid)id);
            }
        }

        public void AssignName(string name)
        {
            Game.Name = name;
        }

        public async Task Join(Player player)
        {
            if (Game.Players.Count == 0)
            {
                player.IsAdmin = true;
            }

            player.Id = Game.Players.Count + 1;
            player.State = PlayerState.WaitingTurn;

            Game.Players.Add(player);

            await Save();
        }

        public async Task Deal()
        {
            while (Game.Players.Any(player => player.Cards.Count != _playerHand))
            {
                foreach (var player in Game.Players)
                {
                    var position = _random.Next(Game.Deck.Count);

                    player.Cards.Add(Game.Deck[position]);

                    Game.Deck.RemoveAt(position);
                }
            }

            await Save();
        }

        public async Task Start()
        {
            Game.GameState = GameState.InProgress;

            var player = Game.Players[_random.Next(Game.Players.Count)];

            player.State = PlayerState.Turn;

            await Save();
        }

        public async Task<RideTheBus> Load()
        {
            var gameResponse = await _gameState.LoadGame(Game.GameType, Game.Id);

            Game = Converter<RideTheBus>.FromJson(gameResponse);

            return Game;
        }

        public async Task<IList<string>> Play()
        {
            var player = Game.Players.Single(player => player.State == PlayerState.Turn);

            player.State = PlayerState.PlayingTurn;

            await Save();

            List<string> options = null;

            switch (Game.Round)
            {
                case RideTheBusRounds.RedOrBlack:
                    options = _redOrBlackOptions;
                    break;
                case RideTheBusRounds.HigherOrLower:
                    options = _higherOrLowerOptions;
                    break;
                case RideTheBusRounds.InsideOrOutside:
                    options = _insideOrOutsideOptions;
                    break;
                case RideTheBusRounds.NameTheSuit:
                    options = _suitOptions;
                    break;
            }

            return options;
        }

        public async Task SubmitTurn(string choise)
        {
            bool success = false;

            var player = Game.Players.Single(player => player.State == PlayerState.PlayingTurn);

            switch (Game.Round)
            {
                case RideTheBusRounds.RedOrBlack:
                    success = PlayRedOrBlack(choise, player);
                    player.Cards[0].IsVisible = true;
                    if (Game.Players.All(p => p.Cards[0].IsVisible))
                    {
                        Game.Round = RideTheBusRounds.HigherOrLower;
                    }
                    break;
                case RideTheBusRounds.HigherOrLower:
                    success = PlayHighOrLow(choise, player);
                    player.Cards[1].IsVisible = true;
                    if (Game.Players.All(p => p.Cards[1].IsVisible))
                    {
                        Game.Round = RideTheBusRounds.InsideOrOutside;
                    }
                    break;
                case RideTheBusRounds.InsideOrOutside:
                    success = PlayInsideOrOutside(choise, player);
                    player.Cards[2].IsVisible = true;
                    if (Game.Players.All(p => p.Cards[2].IsVisible))
                    {
                        Game.Round = RideTheBusRounds.NameTheSuit;
                    }
                    break;
                case RideTheBusRounds.NameTheSuit:
                    success = PlayNameTheSuit(choise, player);
                    player.Cards[3].IsVisible = true;
                    if (Game.Players.All(p => p.Cards[3].IsVisible))
                    {
                        Game.Round = RideTheBusRounds.RideTheBus;
                    }
                    break;
            }

            var drinks = (int)Game.Round + 1;

            if (!success)
            {
                player.Drinks = drinks;
            }
            else
            {

            }

            await CyclePlayer();
        }

        #region Private Methods
        private async Task Save()
        {
            Game.LastModified = DateTime.Now;

            await _gameState.SaveGame(Game.GameType, Game.Id, Converter<RideTheBus>.ToJson(Game));
        }

        private async Task CyclePlayer()
        {
            var player = Game.Players.Single(player => player.State == PlayerState.PlayingTurn);

            player.State = PlayerState.WaitingTurn;

            if (player.Id == Game.Players.Count)
            {
                Game.Players[0].State = PlayerState.Turn;
            }
            else
            {
                Game.Players[player.Id].State = PlayerState.Turn;
            }

            await Save();
        }

        private async void Load(Guid id)
        {
            var gameResponse = await _gameState.LoadGame(GameType.RideTheBus, id);

            Game = Converter<RideTheBus>.FromJson(gameResponse);
        }

        private bool PlayRedOrBlack(string choice, Player player)
        {
            var correct = false;

            switch (player.Cards[0].Suit)
            {
                case Suit.Diamond:
                case Suit.Heart:
                    if (choice == "Red")
                        correct = true;
                    break;
                case Suit.Spade:
                case Suit.Club:
                    if (choice == "Black")
                        correct = true;
                    break;
            }

            return correct;
        }

        private bool PlayHighOrLow(string choice, Player player)
        {
            var correct = false;

            switch (choice)
            {
                case "Higher":
                    if (player.Cards[0].Value < player.Cards[1].Value)
                    {
                        correct = true;
                    }
                    break;
                case "Lower":
                    if (player.Cards[0].Value < player.Cards[1].Value)
                    {
                        correct = true;
                    }
                    break;
            }

            return correct;
        }

        private bool PlayInsideOrOutside(string choice, Player player)
        {
            var correct = false;

            var cards = new List<Card>() { player.Cards[0], player.Cards[1] }.OrderBy(c => c.Value).ToList();

            switch (choice)
            {
                case "Inside":
                    if (cards[0].Value < player.Cards[2].Value && cards[1].Value > player.Cards[2].Value)
                    {
                        correct = true;
                    }
                    break;
                case "Outside":
                    if (cards[0].Value > player.Cards[2].Value || cards[1].Value < player.Cards[2].Value)
                    {
                        correct = true;
                    }
                    break;
            }

            return correct;
        }

        private bool PlayNameTheSuit(string choice, Player player)
        {
            var suit = (Suit)Enum.Parse(typeof(Suit), choice);

            return suit == player.Cards[3].Suit;
        }
        #endregion
    }
}