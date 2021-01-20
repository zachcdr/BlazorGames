﻿using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models;
using Quarantine.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quarantine.Games
{
    public class DotsGame
    {
        private readonly IHandleGameState _gameState;

        public Dots Game;

        public DotsGame(IHandleGameState gameState, Guid? id = null)
        {
            _gameState = gameState;

            if (id == null)
            {
                Game = new Dots();
                Game.Id = Guid.NewGuid();
                Game.CreatedOn = DateTime.UtcNow;
                Game.GameState = GameState.New;
                Game.Groups = new List<GolfGroup>();
            }
            else
            {
                Load((Guid)id);
            }
        }

        #region Private Methods
        private async void Load(Guid id)
        {
            var gameResponse = await _gameState.LoadGame(GameType.Dots, id);

            Game = Converter<Dots>.FromJson(gameResponse);
        }

        private async Task Save()
        {
            Game.LastModified = DateTime.UtcNow;

            await _gameState.SaveGame(Game.GameType, Game.Id, Converter<Dots>.ToJson(Game));
        }
        #endregion
        public async Task<Dots> Load()
        {
            var gameResponse = await _gameState.LoadGame(Game.GameType, Game.Id);

            Game = Converter<Dots>.FromJson(gameResponse);

            return Game;
        }

        public void AssignName(string name, string password)
        {
            Game.Name = name;
            Game.Password = password;
        }

        public async Task CreateGame(InitiateDots newGame)
        {
            AddNewGroup(newGame.PlayerName, newGame.GolfRoundType);
            Game.Name = newGame.GameName.Trim();
            Game.Password = newGame.Password;
            Game.DotTypes = newGame.DotTypes;
            Game.GolfRoundType = newGame.GolfRoundType;

            await Save();
        }

        public void AddNewGroup(string playerName, GolfRoundType golfRoundType)
        {
            var newGroup = new GolfGroup();
            newGroup.Name = $"Group #{Game.Groups.Count + 1}";
            newGroup.AddPlayer(new Player() { Name = playerName.Trim() }, golfRoundType);
            Game.Groups.Add(newGroup);
        }

        public async Task Start()
        {
            Game.GameState = GameState.InProgress;

            await Save();
        }

        public async Task UpdateHole(HoleUpdate holeUpdate)
        {
            var group = Game.Groups.Single(g => g.Id == holeUpdate.GroupId);
            group.CurrentHole = holeUpdate.CurrentHole;
            group.Golfers = holeUpdate.Golfers;

            if (holeUpdate.CompleteGame)
            {
                Game.GameState = GameState.Complete;
            }

            await Save();
        }
    }
}
