var Consts = (function () {
    "use strict";
    var obj = {
        CELL_MINE: 100,

        STATE_COVERED: 200,
        STATE_FLAGGED: 201,
        STATE_QUESTION: 202,
        STATE_REVEALED_NUMBER: 203,
        STATE_REVEALED_MINE: 204,
        STATE_REVEALED_TRIPPED: 205,
        STATE_REVEALED_FOUND: 206,
        STATE_REVEALED_FORCED: 207,

        GAME_INPROGRESS: 0,
        GAME_WON: 1,
        GAME_LOST: 2,

        STATUS_FLAGGED_TEXT: WinJS.Resources.getString("STATUS_FLAGGED_TEXT").value,

        HOLDTIP_TEXT_FLAG: WinJS.Resources.getString("HOLDTIP_TEXT_FLAG").value,
        HOLDTIP_TEXT_UNFLAG: WinJS.Resources.getString("HOLDTIP_TEXT_UNFLAG").value,
        HOLDTIP_TEXT_QUESTION: WinJS.Resources.getString("HOLDTIP_TEXT_QUESTION").value,

        GAME_WON_TEXT: WinJS.Resources.getString("GAME_WON_TEXT").value,
        GAME_LOST_TEXT: WinJS.Resources.getString("GAME_LOST_TEXT").value,

        CONFIRM_WON_TITLE: WinJS.Resources.getString("CONFIRM_WON_TITLE").value,
        CONFIRM_WON_INFO: WinJS.Resources.getString("CONFIRM_WON_INFO").value,
        CONFIRM_WON_DETAIL_NORMAL: WinJS.Resources.getString("CONFIRM_WON_DETAIL_NORMAL").value,
        CONFIRM_WON_DETAIL_HIGHSCORE: WinJS.Resources.getString("CONFIRM_WON_DETAIL_HIGHSCORE").value,
        CONFIRM_LOST_TITLE: WinJS.Resources.getString("CONFIRM_LOST_TITLE").value,
        CONFIRM_LOST_INFO: WinJS.Resources.getString("CONFIRM_LOST_INFO").value,

        CONFIRM_COMMAND_DISMISS: WinJS.Resources.getString("CONFIRM_COMMAND_DISMISS").value,
        CONFIRM_COMMAND_HIGHSCORE: WinJS.Resources.getString("CONFIRM_COMMAND_HIGHSCORE").value,
        CONFIRM_COMMAND_NEWGAME: WinJS.Resources.getString("CONFIRM_COMMAND_NEWGAME").value,
        CONFIRM_COMMAND_NEWGAME_SHORT: WinJS.Resources.getString("CONFIRM_COMMAND_NEWGAME_SHORT").value,

        HTML_CELLTEMPLATE: "<div id='{0}-{1}' {2}style='-ms-grid-row: {0}; -ms-grid-column: {1};'><div class='glyph'></div></div>",
        HTML_SCORETEMPLATE: "<li><span class='number'>{0}</span><span class='score'>{1}</span><time class='timeago' datetime='{2}'></time></li>",

        EVENT_WINDOW: 500, // in ms

        DIFFICULTY_EASY: 0,
        DIFFICULTY_MEDIUM: 1,
        DIFFICULTY_HARD: 2,
        DIFFICULTY_EASY_MINES: 10,
        DIFFICULTY_EASY_SIZE: 8,
        DIFFICULTY_MEDIUM_MINES: 20,
        DIFFICULTY_MEDIUM_SIZE: 12,
        DIFFICULTY_HARD_MINES: 40,
        DIFFICULTY_HARD_SIZE: 16,

        CSS_THEMES: ["theme0", "theme1", "theme2"],

        SHARE_SCORES_TITLE: WinJS.Resources.getString("SHARE_SCORES_TITLE").value,
        SHARE_SCORES_DESC: WinJS.Resources.getString("SHARE_SCORES_DESC").value,
        SHARE_SCORES_TEXT: WinJS.Resources.getString("SHARE_SCORES_TEXT").value,
        SHARE_SCORES_TEXT_ITEM: WinJS.Resources.getString("SHARE_SCORES_TEXT_ITEM").value,
        SHARE_SCORES_HTML_TEXT: WinJS.Resources.getString("SHARE_SCORES_HTML_TEXT").value,
        SHARE_SCORES_HTML_BLOCK: WinJS.Resources.getString("SHARE_SCORES_HTML_BLOCK").value,
        SHARE_SCORES_HTML_ITEM: WinJS.Resources.getString("SHARE_SCORES_HTML_ITEM").value
    };

    return obj;
}());

String.prototype.format = function () {
    "use strict";
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

String.prototype.capitalize = function () {
    "use strict";
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var Utils = (function () {
    "use strict";

    var obj = {
        msecsToTime: function (msecs) {
            var msec_in_hour = 1000 * 60 * 60, msec_in_min = 1000 * 60, msec_in_sec = 1000, remainder = msecs, h, m, s;

            h = Math.floor(remainder / msec_in_hour);
            remainder = remainder % msec_in_hour;
            m = Math.floor(remainder / msec_in_min);
            remainder = remainder % msec_in_min;
            s = Math.floor(remainder / msec_in_sec);

            if (h > 0) {
                return ("{0}h {1}min {2}s").format(h, m, s);
            } else if (m > 0) {
                return ("{0}min {1}s").format(m, s);
            } else {
                return ("{0}s").format(s);
            }
        },

        getID: function (r, c) {
            return "#" + r + "-" + c;
        },

        nameForDifficulty: function (diff) {
            switch (diff) {
                case 1:
                    return "medium";
                case 2:
                    return "hard";
                default:
                    return "easy";
            }
        }

    };

    return obj;
}());