// Fallback implementations of the JavaScript functions the recovered C# code calls.
// Each one only defines itself if the real version hasn't already been loaded,
// so once you copy your original wwwroot scripts in (and reference them in _Host.cshtml),
// those take over automatically.

window.passwordPrompt = window.passwordPrompt || {
    // Used by NFL Pickems and Ride The Bus password checks.
    showPrompt: function (message) {
        return prompt(message);
    }
};

window.OnScrollEvent = window.OnScrollEvent || function () {
    // Called by the Dots game after each hole update.
    window.scrollTo(0, 0);
};

window.generatePieChart = window.generatePieChart || function () {
    // Used by TraceAce stats (ChorerStats.razor). The original likely used a charting library.
    console.warn("generatePieChart: original chart script not found - copy your wwwroot scripts back in.");
};

window.volumeTimeStats = window.volumeTimeStats || function () {
    // Used by TraceAce pump stats (VolumeStats.razor).
    console.warn("volumeTimeStats: original chart script not found - copy your wwwroot scripts back in.");
};
