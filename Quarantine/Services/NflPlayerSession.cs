using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.JSInterop;
using Quarantine.Helpers;
using Quarantine.Interfaces;
using Quarantine.Models.NflPickems;

namespace Quarantine.Services
{
    /// <summary>
    /// Which NFL Pickems player is using this browser. Signing in once stores a server-signed token in
    /// localStorage, so the player stays signed in on that device. The token carries a hash of the player's
    /// password, so changing the password signs every device out.
    /// Signing in as Chap (the commissioner) bypasses every pick lock and lets him edit anyone's picks.
    /// </summary>
    public class NflPlayerSession
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly IDataProtector _protector;
        private readonly INflPlayerService _playerService;
        private Task _loadTask;

        public NflPlayerSession(IJSRuntime jsRuntime, IDataProtectionProvider dataProtectionProvider, INflPlayerService playerService)
        {
            _jsRuntime = jsRuntime;
            _protector = dataProtectionProvider.CreateProtector("NflPickems.PlayerSession");
            _playerService = playerService;
        }

        public Player Player { get; private set; }
        public bool IsLoaded { get; private set; }
        public bool IsSignedIn => Player != null;
        public bool IsCommissioner => Player?.Id == NflPickLock.CommissionerPlayerId;

        /// <summary>Raised after loading, signing in, or signing out.</summary>
        public event Action Changed;

        /// <summary>
        /// Reads the stored token. JS interop isn't available while prerendering, so call this from
        /// OnAfterRenderAsync. Safe to call from several components; the token is only read once.
        /// </summary>
        public Task LoadAsync()
        {
            return _loadTask ??= LoadCoreAsync();
        }

        /// <summary>
        /// Signs in, or claims the player by setting their password if they don't have one yet.
        /// Returns an error message, or null on success.
        /// </summary>
        public async Task<string> SignInAsync(int playerId, string password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                return "Enter a password.";
            }

            var player = (await _playerService.GetPlayers()).SingleOrDefault(p => p.Id == playerId);
            if (player == null)
            {
                return "Pick your name.";
            }

            if (string.IsNullOrWhiteSpace(player.Password))
            {
                await _playerService.SavePlayerPassword(player.Id, password);
                player.Password = password;
            }
            else if (player.Password != password)
            {
                return "Wrong password (it's case sensitive).";
            }

            await _jsRuntime.InvokeVoidAsync("nflSession.set", _protector.Protect($"{player.Id}|{PasswordStamp(player.Password)}"));
            Player = player;
            Changed?.Invoke();
            return null;
        }

        public async Task SignOutAsync()
        {
            await _jsRuntime.InvokeVoidAsync("nflSession.clear");
            Player = null;
            Changed?.Invoke();
        }

        private async Task LoadCoreAsync()
        {
            Player = await ReadToken(await _jsRuntime.InvokeAsync<string>("nflSession.get"));
            IsLoaded = true;
            Changed?.Invoke();
        }

        private async Task<Player> ReadToken(string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return null;
            }

            string[] parts;
            try
            {
                parts = _protector.Unprotect(token).Split('|');
            }
            catch (CryptographicException)
            {
                // Tampered with, or signed with keys this server no longer has: just sign in again.
                return null;
            }

            if (parts.Length != 2 || !int.TryParse(parts[0], out var playerId))
            {
                return null;
            }

            var player = (await _playerService.GetPlayers()).SingleOrDefault(p => p.Id == playerId);
            return player != null && !string.IsNullOrEmpty(player.Password) && PasswordStamp(player.Password) == parts[1]
                ? player
                : null;
        }

        private static string PasswordStamp(string password)
        {
            using var sha = SHA256.Create();
            return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }
    }
}
