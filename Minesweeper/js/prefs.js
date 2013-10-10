var Prefs = (function () {
    "use strict";
    var obj = {
        roamingSettings: Windows.Storage.ApplicationData.current.roamingSettings,
        localSettings: Windows.Storage.ApplicationData.current.localSettings,
        theme: 0,

        setActiveStyleSheet: function (styleName) {
            $("link[rel*=style][title]").each(function () {
                this.disabled = true;
                if (this.getAttribute("title") === styleName) {
                    this.disabled = false;
                }
            });
        },

        rebuildUI: function () {
            var settings0 = $("#settings0"), settings1 = $("#settings1"), settings2 = $("#settings2");

            settings0.removeClass("settingsSelected");
            settings1.removeClass("settingsSelected");
            settings2.removeClass("settingsSelected");

            switch (this.theme) {
                case 1:
                    settings1.addClass("settingsSelected");
                    break;
                case 2:
                    settings2.addClass("settingsSelected");
                    break;
                default:
                    settings0.addClass("settingsSelected");
                    break;
            }

            this.setActiveStyleSheet(Consts.CSS_THEMES[this.theme]);
        },

        loadPrefs: function () {
            var x = this.roamingSettings.values.theme;
            if (typeof x !== "undefined") {
                this.theme = x;
            }

            this.rebuildUI();
        },

        setTheme: function (t) {
            this.theme = t;
            this.roamingSettings.values.theme = t;
            this.rebuildUI();
        },

        setSuspendState: function (gDifficulty, gData) {
            this.localSettings.values.suspendDifficulty = gDifficulty;
            this.localSettings.values.suspendData = JSON.stringify(gData);
        },

        getSuspendDifficulty: function () {
            return this.localSettings.values.suspendDifficulty;
        },

        getSuspendData: function () {
            var data = this.localSettings.values.suspendData;
            if (typeof data !== "undefined") {
                data = JSON.parse(data);
                if (data) {
                    return data;
                }
            }
            return undefined;
        },

        deleteSuspendState: function () {
            this.localSettings.values.suspendDifficulty = undefined;
            this.localSettings.values.suspendData = undefined;
        }
    };

    return obj;
}());

var HighScores = (function () {
    "use strict";

    var obj = {
        roamingSettings: Windows.Storage.ApplicationData.current.roamingSettings,
        easyScores: null,
        mediumScores: null,
        hardScores: null,

        initHighScores: function () {
            this.easyScores = [null, null, null, null, null, null, null, null, null, null];
            this.mediumScores = [null, null, null, null, null, null, null, null, null, null];
            this.hardScores = [null, null, null, null, null, null, null, null, null, null];
        },

        saveHighScores: function () {
            this.roamingSettings.values.easy = JSON.stringify(this.easyScores);
            this.roamingSettings.values.medium = JSON.stringify(this.mediumScores);
            this.roamingSettings.values.hard = JSON.stringify(this.hardScores);
        },

        rebuildHighScoreUI: function () {
            var easyBox = $("#score-easy ol"), mediumBox = $("#score-medium ol"), hardBox = $("#score-hard ol"), i, result;

            easyBox.empty();
            for (i = 0; i < 10 && this.easyScores[i]; i++) {
                result = Consts.HTML_SCORETEMPLATE.format((i + 1), Utils.msecsToTime(this.easyScores[i].t), (new Date(this.easyScores[i].d)).toISOString());
                $(result).appendTo(easyBox);
            }

            mediumBox.empty();
            for (i = 0; i < 10 && this.mediumScores[i]; i++) {
                result = Consts.HTML_SCORETEMPLATE.format((i + 1), Utils.msecsToTime(this.mediumScores[i].t), (new Date(this.mediumScores[i].d)).toISOString());
                $(result).appendTo(mediumBox);
            }

            hardBox.empty();
            for (i = 0; i < 10 && this.hardScores[i]; i++) {
                result = Consts.HTML_SCORETEMPLATE.format((i + 1), Utils.msecsToTime(this.hardScores[i].t), (new Date(this.hardScores[i].d)).toISOString());
                $(result).appendTo(hardBox);
            }

            $("time.timeago").timeago();
        },

        loadHighScores: function () {
            var x = this.roamingSettings.values.easy, y = this.roamingSettings.values.medium, z = this.roamingSettings.values.hard;
            this.initHighScores();
            if (typeof x !== "undefined") {
                x = JSON.parse(x);
                if (x) {
                    this.easyScores = x;
                }
            }
            if (typeof y !== "undefined") {
                y = JSON.parse(y);
                if (y) {
                    this.mediumScores = y;
                }
            }
            if (typeof z !== "undefined") {
                z = JSON.parse(z);
                if (z) {
                    this.hardScores = z;
                }
            }
            this.rebuildHighScoreUI();
        },

        attemptAddScore: function (time, date, diff) {
            var list, i;
            switch (diff) {
                case Consts.DIFFICULTY_MEDIUM:
                    list = this.mediumScores;
                    break;
                case Consts.DIFFICULTY_HARD:
                    list = this.hardScores;
                    break;
                default:
                    list = this.easyScores;
                    break;
            }

            for (i = 0; i < 10; i++) {
                if (!list[i] || list[i].t > time) {
                    list.splice(i, 0, { t: time, d: date });
                    list.pop();
                    this.saveHighScores();
                    this.rebuildHighScoreUI();
                    return (i + 1);
                }
            }

            return 0;
        },

        resetHighScores: function () {
            this.initHighScores();
            this.saveHighScores();
            this.rebuildHighScoreUI();
        },

        processShare: function (req) {
            var plainText = Consts.SHARE_SCORES_TEXT, htmlText = Consts.SHARE_SCORES_HTML_TEXT, lineItems, block, i;
            req.data.properties.title = Consts.SHARE_SCORES_TITLE;
            req.data.properties.description = Consts.SHARE_SCORES_DESC;

            if (this.easyScores[0]) {
                plainText += Consts.SHARE_SCORES_TEXT_ITEM.format(Utils.nameForDifficulty(0).capitalize(), Utils.msecsToTime(this.easyScores[0].t));
            }
            if (this.mediumScores[0]) {
                plainText += Consts.SHARE_SCORES_TEXT_ITEM.format(Utils.nameForDifficulty(1).capitalize(), Utils.msecsToTime(this.mediumScores[0].t));
            }
            if (this.hardScores[0]) {
                plainText += Consts.SHARE_SCORES_TEXT_ITEM.format(Utils.nameForDifficulty(2).capitalize(), Utils.msecsToTime(this.hardScores[0].t));
            }
            req.data.setText(plainText);

            lineItems = "";
            for (i = 0; i < 10 && this.easyScores[i]; i++) {
                lineItems += Consts.SHARE_SCORES_HTML_ITEM.format(Utils.msecsToTime(this.easyScores[i].t), (new Date(this.easyScores[i].d)).toLocaleDateString());
            }
            if (lineItems.length > 0) {
                htmlText += Consts.SHARE_SCORES_HTML_BLOCK.format(Utils.nameForDifficulty(0).capitalize(), lineItems);
            }
            lineItems = "";
            for (i = 0; i < 10 && this.mediumScores[i]; i++) {
                lineItems += Consts.SHARE_SCORES_HTML_ITEM.format(Utils.msecsToTime(this.mediumScores[i].t), (new Date(this.mediumScores[i].d)).toLocaleDateString());
            }
            if (lineItems.length > 0) {
                htmlText += Consts.SHARE_SCORES_HTML_BLOCK.format(Utils.nameForDifficulty(1).capitalize(), lineItems);
            }
            lineItems = "";
            for (i = 0; i < 10 && this.hardScores[i]; i++) {
                lineItems += Consts.SHARE_SCORES_HTML_ITEM.format(Utils.msecsToTime(this.hardScores[i].t), (new Date(this.hardScores[i].d)).toLocaleDateString());
            }
            if (lineItems.length > 0) {
                htmlText += Consts.SHARE_SCORES_HTML_BLOCK.format(Utils.nameForDifficulty(2).capitalize(), lineItems);
            }
            
            var htmlFormat = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(htmlText);
            req.data.setHtmlFormat(htmlFormat);
        }
    };

    return obj;
}());