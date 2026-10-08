using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;

namespace Quarantine.Games
{
    public class RideTheBusGame
    {
        private readonly IHandleGameState _gameState;

        private readonly int _playerHand = 4;

        private readonly List<string> _redOrBlackOptions = new List<string> { "Red", "Black" };

        private readonly List<string> _higherOrLowerOptions = new List<string> { "Higher", "Lower" };

        private readonly List<string> _insideOrOutsideOptions = new List<string> { "Inside", "Outside" };

        private readonly List<string> _suitOptions = new List<string> { "Heart", "Club", "Diamond", "Spade" };

        private Random _random = new Random();

        public RideTheBus Game;

        public RideTheBusGame(IHandleGameState gameState, Guid? id = null)
        {
            _gameState = gameState;
            if (!id.HasValue)
            {
                Game = new RideTheBus();
                Game.Id = Guid.NewGuid();
                Game.GameState = GameState.New;
            }
            else
            {
                Load(id.Value);
            }
        }

        public void AssignName(string name, string password)
        {
            Game.Name = name;
            Game.Password = password;
        }

        public async Task Join(Player player)
        {
            Drinker drinker = (Drinker)player;
            if (Game.Players.Count == 0)
            {
                drinker.IsAdmin = true;
            }
            drinker.Id = Game.Players.Count + 1;
            drinker.State = PlayerState.WaitingTurn;
            Game.Players.Add(drinker);
            await Save();
        }

        public async Task Deal()
        {
            DealCards();
            await Save();
        }

        /// <summary>
        /// Deals and starts in a single save. With separate saves, a background reload landing in between
        /// could start the game from a pre-deal copy, leaving everyone with an empty hand.
        /// </summary>
        public async Task DealAndStart()
        {
            DealCards();
            Game.GameState = GameState.InProgress;
            Game.Players[_random.Next(Game.Players.Count)].State = PlayerState.Turn;
            await Save();
        }

        /// <summary>Loads the latest saved game without replacing <see cref="Game"/>.</summary>
        public async Task<RideTheBus> Peek()
        {
            return Converter<RideTheBus>.FromJson(await _gameState.LoadGame(Game.GameType, Game.Id.ToString()));
        }

        private void DealCards()
        {
            Game.Round = RideTheBusRounds.RedOrBlack;
            while (Game.Players.Any((Drinker player) => player.Cards.Count != _playerHand))
            {
                foreach (Drinker player in Game.Players)
                {
                    int index = _random.Next(Game.Deck.Count);
                    player.Cards.Add(Game.Deck[index]);
                    Game.Deck.RemoveAt(index);
                }
                while (Game.Bus.Count != 16)
                {
                    int index2 = _random.Next(Game.Deck.Count);
                    Game.Bus.Add(Game.Deck[index2]);
                    Game.Deck.RemoveAt(index2);
                }
            }
        }

        public async Task Start()
        {
            Game.GameState = GameState.InProgress;
            Drinker drinker = Game.Players[_random.Next(Game.Players.Count)];
            drinker.State = PlayerState.Turn;
            await Save();
        }

        public async Task<RideTheBus> Load()
        {
            Game = Converter<RideTheBus>.FromJson(await _gameState.LoadGame(Game.GameType, Game.Id.ToString()));
            return Game;
        }

        public async Task<IList<string>> Play()
        {
            Drinker drinker = Game.Players.Single((Drinker player) => player.State == PlayerState.Turn);
            if (Game.Players.All((Drinker p) => p.Cards.Count == 0))
            {
                // Repairs games that were started with empty hands before deal and start became one save.
                DealCards();
            }
            if (HasPendingGive(drinker.Id))
            {
                return null;
            }
            drinker.State = PlayerState.PlayingTurn;
            await Save();
            List<string> result = null;
            switch (Game.Round)
            {
            case RideTheBusRounds.RedOrBlack:
                result = _redOrBlackOptions;
                break;
            case RideTheBusRounds.HigherOrLower:
                result = _higherOrLowerOptions;
                break;
            case RideTheBusRounds.InsideOrOutside:
                result = _insideOrOutsideOptions;
                break;
            case RideTheBusRounds.NameTheSuit:
                result = _suitOptions;
                break;
            }
            return result;
        }

        public async Task<RideTheBus> PlayerSwitch(string name)
        {
            Drinker drinker = Game.Players.Single((Drinker player) => player.Name == name);
            if (drinker.State == PlayerState.PlayingTurn && !HasPendingGive(drinker.Id))
            {
                drinker.State = PlayerState.Turn;
                await Save();
                Game = await Load();
            }
            return Game;
        }

        public async Task SubmitTurn(string choise)
        {
            Game.Players.ToList().ForEach(delegate(Drinker p)
            {
                p.Drinks = 0;
            });
            int num = (int)(Game.Round + 1);
            // Captured up front: the switch below moves Game.Round on once everyone has played this round.
            RideTheBusRounds playedRound = Game.Round;
            bool flag2 = false;
            Drinker player2 = Game.Players.Single((Drinker player) => player.State == PlayerState.PlayingTurn);
            switch (Game.Round)
            {
            case RideTheBusRounds.RedOrBlack:
                flag2 = PlayRedOrBlack(choise, player2);
                player2.Cards[0].IsVisible = true;
                if (Game.Players.All((Drinker p) => p.Cards[0].IsVisible))
                {
                    Game.Round = RideTheBusRounds.HigherOrLower;
                }
                break;
            case RideTheBusRounds.HigherOrLower:
                flag2 = PlayHighOrLow(choise, player2);
                player2.Cards[1].IsVisible = true;
                if (Game.Players.All((Drinker p) => p.Cards[1].IsVisible))
                {
                    Game.Round = RideTheBusRounds.InsideOrOutside;
                }
                break;
            case RideTheBusRounds.InsideOrOutside:
                flag2 = PlayInsideOrOutside(choise, player2);
                player2.Cards[2].IsVisible = true;
                if (Game.Players.All((Drinker p) => p.Cards[2].IsVisible))
                {
                    Game.Round = RideTheBusRounds.NameTheSuit;
                }
                break;
            case RideTheBusRounds.NameTheSuit:
                flag2 = PlayNameTheSuit(choise, player2);
                player2.Cards[3].IsVisible = true;
                if (Game.Players.All((Drinker p) => p.Cards[3].IsVisible))
                {
                    Game.Round = RideTheBusRounds.RideTheBus;
                }
                break;
            }
            if (!flag2 && IsSameCard(player2, playedRound))
            {
                // House rule: matching a card on Higher or Lower / Inside or Outside doubles the drinks (4 and 6).
                num *= 2;
            }
            Drinker onlyOther = OnlyOtherPlayer(player2);
            if (flag2 && onlyOther != null)
            {
                // Two-player game: there's only one person to give to, so skip the pick.
                onlyOther.Drinks = num;
                onlyOther.TotalDrinks += num;
                EndTurn(player2);
            }
            else if (flag2)
            {
                // Correct guess: the player picks who drinks (GiveDrinks), which then passes the turn on.
                Game.PendingGives.Add(new PendingGive
                {
                    PlayerId = player2.Id,
                    Drinks = num,
                    FromBus = false
                });
            }
            else
            {
                player2.Drinks = num;
                player2.TotalDrinks += num;
                EndTurn(player2);
            }
            await Save();
        }

        /// <summary>
        /// Settles a pending pick: <paramref name="targetId"/> drinks what <paramref name="giverId"/> is owed to hand out.
        /// Reloads first so simultaneous picks on a bus card don't overwrite each other.
        /// </summary>
        public async Task GiveDrinks(int giverId, int targetId)
        {
            await Load();
            PendingGive pending = Game.PendingGives.FirstOrDefault((PendingGive g) => g.PlayerId == giverId);
            Drinker target = Game.Players.SingleOrDefault((Drinker p) => p.Id == targetId);
            if (pending == null || target == null || targetId == giverId)
            {
                return;
            }
            target.Drinks += pending.Drinks;
            target.TotalDrinks += pending.Drinks;
            Game.PendingGives.Remove(pending);
            if (!pending.FromBus)
            {
                EndTurn(Game.Players.Single((Drinker p) => p.Id == giverId));
            }
            await Save();
        }

        /// <summary>The other player in a two-player game (the only possible pick); otherwise null.</summary>
        private Drinker OnlyOtherPlayer(Drinker giver)
        {
            return Game.Players.Count == 2 ? Game.Players.Single((Drinker p) => p.Id != giver.Id) : null;
        }

        public bool HasPendingGive(int playerId)
        {
            return Game.PendingGives.Any((PendingGive g) => g.PlayerId == playerId);
        }

        /// <summary>Passes the turn to the next player; once round 4 is done everyone waits for the bus.</summary>
        private void EndTurn(Drinker current)
        {
            current.State = PlayerState.WaitingTurn;
            int index = Game.Players.IndexOf(current);
            Game.Players[(index + 1) % Game.Players.Count].State = PlayerState.Turn;
            if (Game.Round == RideTheBusRounds.RideTheBus)
            {
                Game.Players.ToList().ForEach(delegate(Drinker p)
                {
                    p.State = PlayerState.WaitingTurn;
                });
            }
        }

        public async Task PlayRideTheBus()
        {
            await Load();
            if (Game.PendingGives.Any() || Game.GameState == GameState.Complete)
            {
                return;
            }
            Game.Players.ToList().ForEach(delegate(Drinker p)
            {
                p.Drinks = 0;
            });
            Card card = Game.Bus.First((Card c) => !c.IsVisible);
            int num = Game.Bus.IndexOf(card);
            int drinks = GetDrinks(num);
            List<Drinker> players = Game.Players.Where((Drinker p) => p.Cards.Any((Card c) => c.Value == card.Value)).ToList();
            if (num % 2 == 0)
            {
                // Give column: everyone holding a match picks who takes their drinks (drinks x matches).
                foreach (Drinker giver in players)
                {
                    int amount = drinks * giver.Cards.Count((Card c) => c.Value == card.Value);
                    Drinker onlyOther = OnlyOtherPlayer(giver);
                    if (onlyOther != null)
                    {
                        // Two-player game: no pick needed.
                        onlyOther.Drinks += amount;
                        onlyOther.TotalDrinks += amount;
                        continue;
                    }
                    Game.PendingGives.Add(new PendingGive
                    {
                        PlayerId = giver.Id,
                        Drinks = amount,
                        FromBus = true
                    });
                }
            }
            else
            {
                foreach (Drinker item in players)
                {
                    int num3 = (item.Drinks = drinks * item.Cards.Where((Card c) => c.Value == card.Value).Count());
                    item.TotalDrinks += num3;
                }
            }
            if (num == 15)
            {
                Game.GameState = GameState.Complete;
            }
            card.IsVisible = true;
            await Save();
        }

        private async Task Save()
        {
            Game.LastModified = DateTime.UtcNow;
            await _gameState.SaveGame(Game.GameType, Game.Id.ToString(), Converter<RideTheBus>.ToJson(Game));
        }

        private async void Load(Guid id)
        {
            Game = Converter<RideTheBus>.FromJson(await _gameState.LoadGame(GameType.RideTheBus, id.ToString()));
        }

        private bool PlayRedOrBlack(string choice, Drinker player)
        {
            bool result = false;
            switch (player.Cards[0].Suit)
            {
            case Suit.Heart:
            case Suit.Diamond:
                if (choice == "Red")
                {
                    result = true;
                }
                break;
            case Suit.Club:
            case Suit.Spade:
                if (choice == "Black")
                {
                    result = true;
                }
                break;
            }
            return result;
        }

        private bool PlayHighOrLow(string choice, Drinker player)
        {
            bool result = false;
            if (!(choice == "Higher"))
            {
                if (choice == "Lower" && player.Cards[0].Value > player.Cards[1].Value)
                {
                    result = true;
                }
            }
            else if (player.Cards[0].Value < player.Cards[1].Value)
            {
                result = true;
            }
            return result;
        }

        private bool PlayInsideOrOutside(string choice, Drinker player)
        {
            bool result = false;
            List<Card> list = new List<Card>
            {
                player.Cards[0],
                player.Cards[1]
            }.OrderBy((Card c) => c.Value).ToList();
            if (!(choice == "Inside"))
            {
                if (choice == "Outside" && (list[0].Value > player.Cards[2].Value || list[1].Value < player.Cards[2].Value))
                {
                    result = true;
                }
            }
            else if (list[0].Value < player.Cards[2].Value && list[1].Value > player.Cards[2].Value)
            {
                result = true;
            }
            return result;
        }

        /// <summary>
        /// True when the card just flipped has the same value as a card it was guessed against:
        /// the first card on Higher or Lower, or either of the first two cards on Inside or Outside.
        /// </summary>
        private static bool IsSameCard(Drinker player, RideTheBusRounds round)
        {
            switch (round)
            {
            case RideTheBusRounds.HigherOrLower:
                return player.Cards[1].Value == player.Cards[0].Value;
            case RideTheBusRounds.InsideOrOutside:
                return player.Cards[2].Value == player.Cards[0].Value || player.Cards[2].Value == player.Cards[1].Value;
            default:
                return false;
            }
        }

        private bool PlayNameTheSuit(string choice, Drinker player)
        {
            Suit suit = (Suit)Enum.Parse(typeof(Suit), choice);
            return suit == player.Cards[3].Suit;
        }

        private int GetDrinks(int index)
        {
            switch (index)
            {
            case 0:
            case 3:
                return 2;
            case 1:
            case 2:
                return 1;
            case 4:
            case 5:
            case 6:
            case 7:
                return 2;
            default:
                if (index >= 8 && index < 12)
                {
                    return 3;
                }
                if (index == 12 || index == 15)
                {
                    return 8;
                }
                return 4;
            }
        }
    }
}
