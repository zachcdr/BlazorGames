// Remembers which NFL Pickems player is signed in on this device. The value is a token signed by the
// server (see NflPlayerSession.cs), so editing it by hand just signs you out.
window.nflSession = {
    get: function () {
        try {
            return localStorage.getItem("nflPickemsPlayer");
        } catch (e) {
            return null;
        }
    },
    set: function (token) {
        try {
            localStorage.setItem("nflPickemsPlayer", token);
        } catch (e) {
        }
    },
    clear: function () {
        try {
            localStorage.removeItem("nflPickemsPlayer");
        } catch (e) {
        }
    }
};
