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
    public class DotsGame
    {
        private readonly IHandleGameState _gameState;

        public Dots Game;

        public DotsGame(IHandleGameState gameState, Guid? id = null)
        {
            _gameState = gameState;
            if (!id.HasValue)
            {
                Game = new Dots();
                Game.Id = Guid.NewGuid();
                Game.CreatedOn = DateTime.UtcNow;
                Game.GameState = GameState.New;
                Game.Groups = new List<GolfGroup>();
            }
            else
            {
                Load(id.Value);
            }
        }

        private async void Load(Guid id)
        {
            Game = Converter<Dots>.FromJson(await _gameState.LoadGame(GameType.Dots, id.ToString()));
        }

        private async Task Save()
        {
            Game.LastModified = DateTime.UtcNow;
            await _gameState.SaveGame(Game.GameType, Game.Id.ToString(), Converter<Dots>.ToJson(Game));
        }

        public async Task<Dots> Load()
        {
            Game = Converter<Dots>.FromJson(await _gameState.LoadGame(Game.GameType, Game.Id.ToString()));
            return Game;
        }

        public void AssignName(string name, string password)
        {
            Game.Name = name;
            Game.Password = password;
        }

        public async Task CreateGame(InitiateDots newGame)
        {
            AddNewGroup(newGame.PlayerName, newGame.GolfRoundType, newGame.NineType);
            Game.Name = newGame.GameName.Trim();
            Game.Password = newGame.Password;
            Game.DotTypes = newGame.DotTypes;
            Game.GolfRoundType = newGame.GolfRoundType;
            Game.NineType = newGame.NineType;
            if (!string.IsNullOrWhiteSpace(newGame.CourseName))
            {
                Game.Groups.ForEach(delegate(GolfGroup g)
                {
                    g.CourseName = newGame.CourseName;
                });
                if (string.IsNullOrWhiteSpace(newGame.CourseTeeBox))
                {
                    Course course = CourseSelection.SelectCourse(newGame.CourseName);
                    newGame.CourseTeeBox = course.CourseHoles.First().Tees.First().Color;
                }
                Game.Groups.ForEach(delegate(GolfGroup g)
                {
                    g.CourseTeeBox = newGame.CourseTeeBox;
                });
            }
            await Save();
        }

        public void AddNewGroup(string playerName, GolfRoundType golfRoundType, NineType? nineType)
        {
            GolfGroup golfGroup = new GolfGroup(nineType);
            golfGroup.Name = $"Group #{Game.Groups.Count + 1}";
            golfGroup.AddPlayer(new Player
            {
                Name = playerName.Trim()
            }, golfRoundType, nineType);
            Game.Groups.Add(golfGroup);
        }

        public async Task Start()
        {
            Game.GameState = GameState.InProgress;
            await Save();
        }

        public async Task UpdateHole(HoleUpdate holeUpdate)
        {
            GolfGroup golfGroup = Game.Groups.Single((GolfGroup g) => g.Id == holeUpdate.GroupId);
            golfGroup.CurrentHole = holeUpdate.CurrentHole;
            golfGroup.Golfers = holeUpdate.Golfers;
            if (holeUpdate.CompleteGame)
            {
                Game.GameState = GameState.Complete;
            }
            await Save();
        }
    }
}
