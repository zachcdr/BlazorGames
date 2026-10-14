// Blazor Server loses its connection whenever a phone backgrounds the tab. Instead of the default full-screen modal:
//  - a small "Reconnecting…" pill shows (styled in site.css; it waits a second so quick blips never show),
//  - coming back to the tab retries right away instead of waiting for the next scheduled attempt,
//  - if the server has already dropped this session, the page reloads. Picks, games and sign-in are all saved,
//    so a reload loses nothing. At most one automatic reload per 30 seconds, so a dead server can't cause a loop.
(function () {
    var modal = document.getElementById("components-reconnect-modal");
    if (!modal) {
        return;
    }

    var reloadKey = "blazorAutoReloadAt";

    function isDown() {
        return /components-reconnect-(show|failed|rejected)/.test(modal.className);
    }

    function isLost() {
        return /components-reconnect-(failed|rejected)/.test(modal.className);
    }

    function reload() {
        var last = 0;
        try {
            last = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
            sessionStorage.setItem(reloadKey, String(Date.now()));
        } catch (e) {
        }
        if (Date.now() - last > 30000) {
            location.reload();
        }
        // Otherwise leave the "Connection lost · Tap to reload" pill up.
    }

    new MutationObserver(function () {
        if (isLost()) {
            reload();
        }
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible" || !isDown() || !window.Blazor || !window.Blazor.reconnect) {
            return;
        }
        Promise.resolve(window.Blazor.reconnect()).then(function (reconnected) {
            if (reconnected === false) {
                reload();
            }
        }, reload);
    });

    modal.addEventListener("click", function () {
        if (isLost()) {
            location.reload();
        }
    });
})();
