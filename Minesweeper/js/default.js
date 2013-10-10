(function () {
    "use strict";
    // Uncomment the following line to enable first chance exceptions.
    // Debug.enableFirstChanceException(true);

    // MINEWSWEEPER CODE
    var GameOptions = {
        boardSize: 8,
        numberOfMines: 10,
        difficulty: 0
    }, GameData = {
        mines: null,
        state: null,
        changedSinceLastUpdate: null,
        cachedFlaggedNumber: 0,
        startTime: 0,
        elapsed: 0,
        interval: 0,
        mode: Consts.GAME_INPROGRESS
    }, LastEvent = {
        r: 0,
        c: 0,
        startTime: 0,
        pointerId: -1,
        button: -1,
        element: null,
        trackedElement: null
    };

    // Ensure game board is a square
    function onOrientationChanged() {
        var gamePane = $("#gamePane"), gameGrid = $("#gameGrid"), size = Math.min(gamePane.height(), gamePane.width());

        gameGrid.height(size);
        gameGrid.width(size);
    }

    function resetState() {
        var i, j;
        GameData.state = [];
        for (i = 1; i <= GameOptions.boardSize; i++) {
            GameData.state[i] = [];
            for (j = 1; j <= GameOptions.boardSize; j++) {
                GameData.state[i][j] = Consts.STATE_COVERED;
            }
        }
    }

    function resetDrawInfo() {
        var i, j;
        GameData.changedSinceLastUpdate = [];
        for (i = 1; i <= GameOptions.boardSize; i++) {
            GameData.changedSinceLastUpdate[i] = [];
            for (j = 1; j <= GameOptions.boardSize; j++) {
                GameData.changedSinceLastUpdate[i][j] = true;
            }
        }
    }

    function resetUI() {
        GameData.mode = Consts.GAME_INPROGRESS;
        GameData.mines = null;
        GameData.state = null;
        GameData.changedSinceLastUpdate = null;
        clearInterval(GameData.interval);
        GameData.startTime = 0;
        GameData.elapsed = 0;
        GameData.cachedFlaggedNumber = 0;

        LastEvent.r = 0;
        LastEvent.c = 0;
        LastEvent.startTime = 0;
        LastEvent.pointerId = -1;
        LastEvent.button = -1;
        LastEvent.element = null;
        LastEvent.trackedElement = null;

        $("#holdProgress").stop(true).width(0);
        $("#holdToFlag").stop(true).hide().css("top", 0).css("left", 0);

        resetState();
        resetDrawInfo();

        $("#infoTime").html(Utils.msecsToTime(0));
        $("#infoFlagged").html(Consts.STATUS_FLAGGED_TEXT.format(0, GameOptions.numberOfMines));

        $("#commandReset").hide();
    }

    function updateUI() {
        var r, c, cellElement, inner, text;
        for (r = 1; r <= GameOptions.boardSize; r++) {
            for (c = 1; c <= GameOptions.boardSize; c++) {
                if (GameData.changedSinceLastUpdate[r][c]) {
                    GameData.changedSinceLastUpdate[r][c] = false;

                    cellElement = $(Utils.getID(r, c));
                    inner = cellElement.children();

                    cellElement.removeClass("cellCovered cellNumber cellMine cellTripped cellFlag cellFound cellQuestion");
                    inner.empty();

                    switch (GameData.state[r][c]) {
                        case Consts.STATE_FLAGGED:
                            cellElement.addClass("cellFlag");
                            break;
                        case Consts.STATE_REVEALED_NUMBER:
                            cellElement.addClass("cellNumber");
                            if (GameData.mines[r][c] !== 0) {
                                inner.html(GameData.mines[r][c]);
                            }
                            break;
                        case Consts.STATE_REVEALED_FORCED:
                            cellElement.addClass("cellNumber");
                            break;
                        case Consts.STATE_REVEALED_MINE:
                            cellElement.addClass("cellMine");
                            break;
                        case Consts.STATE_REVEALED_TRIPPED:
                            cellElement.addClass("cellTripped");
                            break;
                        case Consts.STATE_REVEALED_FOUND:
                            cellElement.addClass("cellFound");
                            break;
                        case Consts.STATE_QUESTION:
                            cellElement.addClass("cellQuestion");
                            break;
                        default:
                            cellElement.addClass("cellCovered");
                            break;
                    }
                }
            }
        }

        switch (GameData.mode) {
            case Consts.GAME_WON:
                text = Consts.GAME_WON_TEXT;
                break;
            case Consts.GAME_LOST:
                text = Consts.GAME_LOST_TEXT;
                break;
            default:
                text = Consts.STATUS_FLAGGED_TEXT.format(GameData.cachedFlaggedNumber, GameOptions.numberOfMines);
                break;
        }
        $("#infoFlagged").html(text);
    }

    function pauseTimer() {
        clearInterval(GameData.interval);
    }

    function resumeTimer() {
        clearInterval(GameData.interval); // Just in case, prevents timer double-dipping
        if (GameData.mode === Consts.GAME_INPROGRESS && GameData.elapsed > 0) { // Only resume timer if it was running in the first place
            GameData.startTime = Date.now() - GameData.elapsed;
            GameData.interval = setInterval(function () {
                GameData.elapsed = Date.now() - GameData.startTime;
                $("#infoTime").html(Utils.msecsToTime(GameData.elapsed));
            }, 200);
        }
    }

    function showHighScores() {
        var incoming = [$(".titleArea").get(0), $("#score-easy").get(0), $("#score-medium").get(0), $("#score-hard").get(0)], outgoing = $("#mainGrid").get(0), transitionPage;

        $("#mainGrid").hide();
        $("#contentHost").show();
        $("#commandHighScores").get(0).winControl.selected = true;

        transitionPage = WinJS.UI.Animation.enterPage(incoming, { top: "0px", left: "100px" }, outgoing);
        transitionPage.then();

        $("#commandReset").show();
        pauseTimer();
    }

    function hideHighScores() {
        var incoming = [$("#infoTile").get(0), $("#gameGrid").get(0)], outgoing = $("#contentHost").get(0), transitionPage;

        $("#commandReset").hide();

        $("#contentHost").hide();
        $("#mainGrid").show();
        $("#commandHighScores").get(0).winControl.selected = false;

        transitionPage = WinJS.UI.Animation.enterPage(incoming, { top: "0px", left: "100px" }, outgoing);
        transitionPage.then();

        resumeTimer();
    }

    function toggleHighScores() {
        if ($("#mainGrid").is(":visible")) {
            showHighScores();
        } else {
            hideHighScores();
        }
    }

    function enterTransition() {
        var enterPage = WinJS.UI.Animation.enterPage([$("#infoTime").get(0), $("#infoFlagged").get(0), $("#gameGrid").get(0)], { top: "0px", left: "100px" });
        enterPage.then();
    }

    function countMinesHelper(r, c) {
        if (r < 1 || r > GameOptions.boardSize || c < 1 || c > GameOptions.boardSize) {
            return 0;
        }
        if (GameData.mines[r][c] === Consts.CELL_MINE) {
            return 1;
        }
        return 0;
    }

    function buildMines(safeRow, safeCol) {
        var i, minesSet, r, c, count, rr, cc;

        // One-based indexing
        GameData.mines = [];
        for (i = 1; i <= GameOptions.boardSize; i++) {
            GameData.mines[i] = [];
        }

        // Set mines
        minesSet = 0;
        while (minesSet < GameOptions.numberOfMines) {
            r = Math.floor(Math.random() * GameOptions.boardSize) + 1;
            c = Math.floor(Math.random() * GameOptions.boardSize) + 1;
            if ((r !== safeRow || c !== safeCol) && GameData.mines[r][c] !== Consts.CELL_MINE) {
                GameData.mines[r][c] = Consts.CELL_MINE;
                minesSet++;
            }
        }

        // Calculate numbers
        for (r = 1; r <= GameOptions.boardSize; r++) {
            for (c = 1; c <= GameOptions.boardSize; c++) {
                if (GameData.mines[r][c] !== Consts.CELL_MINE) {
                    count = 0;
                    for (rr = r - 1; rr <= r + 1; rr++) {
                        for (cc = c - 1; cc <= c + 1; cc++) {
                            count += countMinesHelper(rr, cc);
                        }
                    }
                    GameData.mines[r][c] = count;
                }
            }
        }
    }

    function placeHoldTip(element) {
        var holdTip = $("#holdToFlag");
        holdTip.css("opacity", 1);
        holdTip.css("left", element.position().left + element.innerWidth() / 2 - holdTip.innerWidth() / 2);
        holdTip.css("top", element.position().top - holdTip.height());
    }

    function toggleFlag() {
        switch (GameData.state[LastEvent.r][LastEvent.c]) {
            case Consts.STATE_FLAGGED:
                GameData.state[LastEvent.r][LastEvent.c] = Consts.STATE_QUESTION;
                break;
            case Consts.STATE_QUESTION:
                GameData.state[LastEvent.r][LastEvent.c] = Consts.STATE_COVERED;
                GameData.cachedFlaggedNumber--;
                break;
            default:
                GameData.state[LastEvent.r][LastEvent.c] = Consts.STATE_FLAGGED;
                GameData.cachedFlaggedNumber++;
                break;
        }

        GameData.changedSinceLastUpdate[LastEvent.r][LastEvent.c] = true;

        updateUI();
    }

    function clearBlanks(row, col) {
        if (row < 1 || row > GameOptions.boardSize || col < 1 || col > GameOptions.boardSize) {
            return;
        }

        if (GameData.state[row][col] === Consts.STATE_REVEALED_NUMBER) {
            return;
        } else {
            GameData.state[row][col] = Consts.STATE_REVEALED_NUMBER;
            GameData.changedSinceLastUpdate[row][col] = true;
        }

        if (GameData.mines[row][col] === 0) {
            clearBlanks(row - 1, col - 1);
            clearBlanks(row - 1, col);
            clearBlanks(row - 1, col + 1);
            clearBlanks(row, col - 1);
            clearBlanks(row, col + 1);
            clearBlanks(row + 1, col - 1);
            clearBlanks(row + 1, col);
            clearBlanks(row + 1, col + 1);
        }
    }

    function loseGame(trippedRow, trippedCol) {
        var rr, cc;
        for (rr = 1; rr <= GameOptions.boardSize; rr++) {
            for (cc = 1; cc <= GameOptions.boardSize; cc++) {
                if (GameData.mines[rr][cc] === Consts.CELL_MINE) {
                    GameData.state[rr][cc] = (rr === trippedRow && cc === trippedCol ? Consts.STATE_REVEALED_TRIPPED : Consts.STATE_REVEALED_MINE);
                } else if (GameData.state[rr][cc] !== Consts.STATE_REVEALED_NUMBER) {
                    GameData.state[rr][cc] = Consts.STATE_REVEALED_FORCED;
                }
                GameData.changedSinceLastUpdate[rr][cc] = true;
            }
        }
        clearInterval(GameData.interval);
        GameData.mode = Consts.GAME_LOST;
    }

    function checkGameWon() {
        var count = 0, i, j;

        for (i = 1; i <= GameOptions.boardSize; i++) {
            for (j = 1; j <= GameOptions.boardSize; j++) {
                if (GameData.state[i][j] <= Consts.STATE_QUESTION) {
                    count++;
                }
            }
        }

        if (count <= GameOptions.numberOfMines) {
            // Game won, recolor pieces
            for (i = 1; i <= GameOptions.boardSize; i++) {
                for (j = 1; j <= GameOptions.boardSize; j++) {
                    if (GameData.mines[i][j] === Consts.CELL_MINE) {
                        GameData.state[i][j] = Consts.STATE_REVEALED_FOUND;
                        GameData.changedSinceLastUpdate[i][j] = true;
                    }
                }
            }
            clearInterval(GameData.interval);
            GameData.mode = Consts.GAME_WON;
        }
    }

    function confirmGameEnd() {
        var msg, hsResult, text;
        switch (GameData.mode) {
            case Consts.GAME_WON:
                hsResult = HighScores.attemptAddScore(GameData.elapsed, Date.now(), GameOptions.difficulty);
                text = (hsResult > 0 ? Consts.CONFIRM_WON_DETAIL_HIGHSCORE.format(hsResult, Utils.nameForDifficulty(GameOptions.difficulty)) : Consts.CONFIRM_WON_DETAIL_NORMAL);
                msg = new Windows.UI.Popups.MessageDialog(text + Consts.CONFIRM_WON_INFO, Consts.CONFIRM_WON_TITLE);
                msg.commands.append(new Windows.UI.Popups.UICommand(Consts.CONFIRM_COMMAND_DISMISS, function () { }));
                if (hsResult > 0) {
                    msg.commands.append(new Windows.UI.Popups.UICommand(Consts.CONFIRM_COMMAND_HIGHSCORE, function () {
                        showHighScores();
                    }));
                }
                msg.commands.append(new Windows.UI.Popups.UICommand(Consts.CONFIRM_COMMAND_NEWGAME_SHORT, function () {
                    hideHighScores();
                    resetUI();
                    updateUI();
                }));
                break;
            case Consts.GAME_LOST:
                msg = new Windows.UI.Popups.MessageDialog(Consts.CONFIRM_LOST_INFO, Consts.CONFIRM_LOST_TITLE);
                msg.commands.append(new Windows.UI.Popups.UICommand(Consts.CONFIRM_COMMAND_DISMISS, function () { }));
                msg.commands.append(new Windows.UI.Popups.UICommand(Consts.CONFIRM_COMMAND_NEWGAME, function () {
                    hideHighScores();
                    resetUI();
                    updateUI();
                }));
                break;
            default:
                break;
        }
        msg.showAsync().done();
    }

    function revealCell() {
        if (!GameData.mines) {
            buildMines(LastEvent.r, LastEvent.c);

            // Start timer
            GameData.elapsed = 1; // time must be > 0 to resume!
            resumeTimer();
        }

        var cellData = GameData.mines[LastEvent.r][LastEvent.c];
        if (cellData === Consts.CELL_MINE) {
            // Lose the game.
            loseGame(LastEvent.r, LastEvent.c);
        } else {
            if (cellData === 0) {
                // Recurse
                clearBlanks(LastEvent.r, LastEvent.c);
            } else {
                // Single
                GameData.state[LastEvent.r][LastEvent.c] = Consts.STATE_REVEALED_NUMBER;
                GameData.changedSinceLastUpdate[LastEvent.r][LastEvent.c] = true;
            }
            // Check if the game was won. If so, convert the cells to static cells.
            checkGameWon();
        }

        updateUI();
        if (GameData.mode !== Consts.GAME_INPROGRESS) {
            confirmGameEnd();
        }
    }

    function mHoldFinish() {
        $("#holdProgress").stop(true).width(0);
        $("#holdToFlag").stop(true).hide().css("top", 0).css("left", 0);

        toggleFlag();

        LastEvent.r = 0;
        LastEvent.c = 0;
        LastEvent.startTime = 0;
        LastEvent.pointerId = -1;
        LastEvent.button = -1;
    }

    function mDown(e) {
        if (LastEvent.pointerId !== -1) {
            return; // Another pointer event in progress
        }

        var r = e.data.r, c = e.data.c;

        if (GameData.state[r][c] >= Consts.STATE_REVEALED_NUMBER) {
            return;
        }

        LastEvent.r = r;
        LastEvent.c = c;
        LastEvent.startTime = Date.now();
        LastEvent.pointerId = e.originalEvent.pointerId;
        LastEvent.button = e.originalEvent.button;
        LastEvent.element = $(Utils.getID(r, c)).get(0);
        LastEvent.trackedElement = LastEvent.element;

        switch (GameData.state[r][c]) {
            case Consts.STATE_FLAGGED:
                $("#holdToFlag span").html(Consts.HOLDTIP_TEXT_QUESTION);
                break;
            case Consts.STATE_QUESTION:
                $("#holdToFlag span").html(Consts.HOLDTIP_TEXT_UNFLAG);
                break;
            default:
                $("#holdToFlag span").html(Consts.HOLDTIP_TEXT_FLAG);
                break;
        }
        placeHoldTip($(Utils.getID(r, c)));

        $("#holdToFlag").delay(300).fadeIn(200);
        $("#holdProgress").width(0).delay(500).animate({ width: "100%" }, 1000).queue(mHoldFinish);
    }

    function mDownOutside(e) {
        return false;
    }

    function mUp(e) {
        if (e.originalEvent.pointerId !== LastEvent.pointerId) {
            return;
        }

        var state;

        $("#holdProgress").stop(true, true).width(0);
        $("#holdToFlag").stop(true, true).hide().css("top", 0).css("left", 0);

        if (Date.now() - LastEvent.startTime < Consts.EVENT_WINDOW) {
            state = GameData.state[LastEvent.r][LastEvent.c];
            if (LastEvent.button === 2 && (state === Consts.STATE_COVERED || state === Consts.STATE_FLAGGED || state === Consts.STATE_QUESTION)) {
                // Toggle flag
                toggleFlag();
            } else if (state === Consts.STATE_COVERED) {
                // Uncover
                revealCell();
            }
        }

        LastEvent.r = 0;
        LastEvent.c = 0;
        LastEvent.startTime = 0;
        LastEvent.pointerId = -1;
        LastEvent.button = -1;
        LastEvent.element = null;
        LastEvent.trackedElement = null;
    }

    function mUpOutside(e) {
        if (e.originalEvent.pointerId !== LastEvent.pointerId) {
            return;
        }

        $("#holdProgress").stop(true, true).width(0);
        $("#holdToFlag").stop(true, true).hide().css("top", 0).css("left", 0);

        LastEvent.r = 0;
        LastEvent.c = 0;
        LastEvent.startTime = 0;
        LastEvent.pointerId = -1;
        LastEvent.button = -1;
        LastEvent.element = null;
        LastEvent.trackedElement = null;
    }

    function mCancel(e) {
        mUpOutside(e);
    }

    function mMove(e) {
        if (e.originalEvent.pointerId !== LastEvent.pointerId) {
            return;
        }

        var newElement = $(document.elementFromPoint(e.originalEvent.clientX, e.originalEvent.clientY)).closest(".cell").get(0);
        if (newElement === LastEvent.element && LastEvent.trackedElement !== LastEvent.element) {
            $("#holdToFlag").stop(true, true).fadeIn(200);
            $("#holdProgress").stop(true, true).width(0).animate({ width: "100%" }, 1000).queue(mHoldFinish);
        } else if (newElement !== LastEvent.element && LastEvent.trackedElement === LastEvent.element) {
            $("#holdProgress").stop(true, true).width(0);
            $("#holdToFlag").stop(true, true).hide();
        }

        LastEvent.trackedElement = newElement;
    }

    function buildUI() {
        var cssEasy = "class='cell'", cssMedium = "class='cell cellMedium' ", cssHard = "class='cell cellHard' ", gameGrid = $("#gameGrid"), row, col, cssClass, element;

        gameGrid.empty();

        for (row = 1; row <= Consts.DIFFICULTY_HARD_SIZE; row++) {
            for (col = 1; col <= Consts.DIFFICULTY_HARD_SIZE; col++) {
                if (row > Consts.DIFFICULTY_MEDIUM_SIZE || col > Consts.DIFFICULTY_MEDIUM_SIZE) {
                    cssClass = cssHard;
                } else if (row > Consts.DIFFICULTY_EASY_SIZE || col > Consts.DIFFICULTY_EASY_SIZE) {
                    cssClass = cssMedium;
                } else {
                    cssClass = cssEasy;
                }
                element = $(Consts.HTML_CELLTEMPLATE.format(row, col, cssClass));
                element.appendTo(gameGrid).on("MSPointerDown", { r: row, c: col }, mDown);
                element.on("MSPointerUp", { r: row, c: col }, mUp);
            }
        }
    }

    function reloadHighScoresFragment() {
        WinJS.UI.Fragments.renderCopy("/html/highScores.html", null).done(function (frag) {
            $("#contentHost").empty().append(frag);
            $("#highScoresBack").click(hideHighScores);
            HighScores.loadHighScores();
        });
    }

    function setDifficulty(level) {
        switch (level) {
            case Consts.DIFFICULTY_MEDIUM:
                GameOptions.boardSize = Consts.DIFFICULTY_MEDIUM_SIZE;
                GameOptions.numberOfMines = Consts.DIFFICULTY_MEDIUM_MINES;
                break;
            case 2:
                GameOptions.boardSize = Consts.DIFFICULTY_HARD_SIZE;
                GameOptions.numberOfMines = Consts.DIFFICULTY_HARD_MINES;
                break;
            default:
                GameOptions.boardSize = Consts.DIFFICULTY_EASY_SIZE;
                GameOptions.numberOfMines = Consts.DIFFICULTY_EASY_MINES;
                break;
        }

        $("#gameGrid").removeClass().addClass(Utils.nameForDifficulty(level));
        GameOptions.difficulty = level;
    }

    function commandNewGame(diff) {
        setDifficulty(diff);
        resetUI();
        updateUI();
        hideHighScores();
        $("#appBar")[0].winControl.hide();
    }

    function commandReset() {
        HighScores.resetHighScores();
        $("#flyout-reset").get(0).winControl.hide();
    }

    function onDataChanged() {
        HighScores.loadHighScores();
        Prefs.loadPrefs();
    }

    function onDataRequested(e) {
        var request = e.request;
        if ($("#contentHost").is(":visible")) {
            HighScores.processShare(request);
        }
    }

    function attemptResume() {
        var difficulty = Prefs.getSuspendDifficulty(), data = Prefs.getSuspendData();
        if (typeof difficulty !== "undefined" && typeof data !== "undefined") {
            setDifficulty(difficulty);
            resetUI();

            GameData = data;
            resetDrawInfo();
            $("#infoTime").html(Utils.msecsToTime(GameData.elapsed));
            resumeTimer();

            Prefs.deleteSuspendState();

            return true;
        } else {
            return false;
        }
    }

    function bindEvents() {
        $("#gameGrid").on("MSPointerDown", mDownOutside);
        $("#gameGrid").on("contextmenu", function (e) {
            e.preventDefault();
        });

        $("#mainGrid").on("MSPointerUp", mUpOutside);
        $("#mainGrid").on("MSPointerCancel", mCancel);
        $("#mainGrid").on("MSPointerMove", mMove);

        $("#commandResetConfirm").click(commandReset);

        $("#commandNewEasy").click(function () {
            commandNewGame(Consts.DIFFICULTY_EASY);
        });
        $("#commandNewMedium").click(function () {
            commandNewGame(Consts.DIFFICULTY_MEDIUM);
        });
        $("#commandNewHard").click(function () {
            commandNewGame(Consts.DIFFICULTY_HARD);
        });
        $("#commandHelp").click(function () {
            WinJS.UI.SettingsFlyout.showSettings("AppHelp", "/html/help.html");
            $("#appBar")[0].winControl.hide();
        });

        $("#commandHighScores").click(toggleHighScores);

        $("#settings0").click(function () {
            Prefs.setTheme(0);
        });
        $("#settings1").click(function () {
            Prefs.setTheme(1);
        });
        $("#settings2").click(function () {
            Prefs.setTheme(2);
        });

        $(window).blur(function () {
            if ($("#mainGrid").is(":visible")) {
                pauseTimer();
            }
        });
        $(window).focus(function () {
            if ($("#mainGrid").is(":visible")) {
                resumeTimer();
            }
        });

        $(window).resize(onOrientationChanged);

        Windows.Storage.ApplicationData.current.ondatachanged = onDataChanged;
        Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().ondatarequested = onDataRequested;
    }

    document.addEventListener("DOMContentLoaded", function () {
        // Load the UI
        onOrientationChanged();
        buildUI();
    }, false);

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            // Load prefs and prepare for new game
            Prefs.loadPrefs();
            reloadHighScoresFragment();
            WinJS.Resources.processAll();

            var resumed = false;
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
                resumed = attemptResume();
            }

            resetUI();
            updateUI();
            enterTransition();

            args.setPromise(WinJS.UI.processAll().then(bindEvents));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
        Prefs.setSuspendState(GameOptions.difficulty, GameData);
    };

    WinJS.Application.onsettings = function (e) {
        e.detail.applicationcommands = {
            "ThemePrefs": { title: "Preferences" },
            "AppHelp": { href: "html/help.html", title: "Help" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    }

    app.start();
}());