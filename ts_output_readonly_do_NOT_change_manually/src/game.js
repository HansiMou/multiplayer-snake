;
var game;
(function (game) {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.ALLTIME = 120 * 1000;
    game.GameSpeed = 500;
    game.BoardSize = gameLogic.ROWS;
    game.ComputerOrHuman = [1, -1];
    game.NumberOfFood = gameLogic.NumberOfFood;
    game.NumberOfBarrier = gameLogic.NumberOfBarrier;
    game.ThirdComputerPlayer = false;
    game.currentUpdateUI = null;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.animationEndedTimeout = null;
    game.state = null;
    game.action = null;
    game.computerAction = null;
    game.snakeOneMove = null;
    game.snakeTwoMove = null;
    game.snakeThreeMove = null;
    game.RemainingTime = game.ALLTIME;
    game.reset = true;
    function init() {
        resizeGameAreaService.setWidthToHeight(1);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 3,
            updateUI: updateUI,
            gotMessageFromPlatform: null,
        });
    }
    game.init = init;
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.didMakeMove = false; // Only one move per updateUI
        game.currentUpdateUI = params;
        game.state = params.move.stateAfterMove;
        if (isFirstMove()) {
            game.state = gameLogic.getInitialState();
        }
    }
    game.updateUI = updateUI;
    function makeMove(move) {
        game.reset = false;
        if (game.didMakeMove) {
            return;
        }
        game.didMakeMove = true;
        moveService.makeMove(move);
    }
    function isFirstMove() {
        return !game.currentUpdateUI.move.stateAfterMove;
    }
    function move() {
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        computerMove();
        var nextMove = null;
        try {
            var tmpMove = [angular.copy(game.snakeOneMove), angular.copy(game.snakeTwoMove)];
            if (game.ThirdComputerPlayer) {
                tmpMove.push(angular.copy(game.snakeThreeMove));
            }
            nextMove = gameLogic.createMove(game.state, tmpMove, game.RemainingTime -= game.GameSpeed, game.currentUpdateUI.move.turnIndexAfterMove);
            game.snakeOneMove = null;
            game.snakeTwoMove = null;
            game.snakeThreeMove = null;
        }
        catch (e) {
            $interval.cancel(game.action);
            game.currentUpdateUI.end = true;
            log.error(e);
            return;
        }
        // Move is legal, make it!
        makeMove(nextMove);
    }
    game.move = move;
    function computerMove() {
        var computerMoves = aiService.findComputerMove(game.ComputerOrHuman, game.state.boardWithSnakes);
        if (game.ComputerOrHuman[0] == -1) {
            game.snakeOneMove = computerMoves[0];
        }
        if (game.ComputerOrHuman[1] == -1) {
            game.snakeTwoMove = computerMoves[1];
        }
        if (game.ComputerOrHuman[2] == -1) {
            game.snakeThreeMove = computerMoves[2];
        }
    }
    function resetEverything() {
        $interval.cancel(game.action);
        game.action = null;
        game.RemainingTime = game.ALLTIME;
        game.reset = true;
        game.currentUpdateUI.move.stateAfterMove = null;
        game.currentUpdateUI.end = false;
        updateUI(game.currentUpdateUI);
    }
    function isFood(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'FOOD';
    }
    game.isFood = isFood;
    function isBarrier(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'BARRIER';
    }
    game.isBarrier = isBarrier;
    function isSnakeOne(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'SNAKE1';
    }
    game.isSnakeOne = isSnakeOne;
    function isSnakeTwo(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'SNAKE2';
    }
    game.isSnakeTwo = isSnakeTwo;
    function isSnakeThree(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'SNAKE3';
    }
    game.isSnakeThree = isSnakeThree;
    function isDeadSnake(row, col) {
        return game.state.boardWithSnakes.board[row][col] === 'STONE';
    }
    game.isDeadSnake = isDeadSnake;
    function getNumber() {
        var res = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            res.push(i);
        }
        return res;
    }
    game.getNumber = getNumber;
    function getSnakeLength(index) {
        if (isFirstMove()) {
            return 1;
        }
        else {
            return game.currentUpdateUI.move.stateAfterMove.boardWithSnakes.snakes[index].headToTail.length;
        }
    }
    game.getSnakeLength = getSnakeLength;
    function changeFoodNumber() {
        gameLogic.NumberOfFood = game.NumberOfFood;
        resetEverything();
    }
    game.changeFoodNumber = changeFoodNumber;
    function changeBarrierNumber() {
        gameLogic.NumberOfBarrier = game.NumberOfBarrier;
        resetEverything();
    }
    game.changeBarrierNumber = changeBarrierNumber;
    function changePlayerNumber() {
        if (game.ThirdComputerPlayer) {
            game.ComputerOrHuman.push(-1);
            gameLogic.NumberOfPlayer = 3;
        }
        else {
            game.ComputerOrHuman.pop();
            gameLogic.NumberOfPlayer = 2;
        }
        resetEverything();
    }
    game.changePlayerNumber = changePlayerNumber;
    function isDraw() {
        if (game.currentUpdateUI.end == true) {
            return gameLogic.getWinner(game.currentUpdateUI.move.stateAfterMove.boardWithSnakes) === '';
        }
        return false;
    }
    game.isDraw = isDraw;
    function isFinished() {
        return game.currentUpdateUI.end;
    }
    game.isFinished = isFinished;
    function getWinnerColor() {
        var winner = gameLogic.getWinner(game.currentUpdateUI.move.stateAfterMove.boardWithSnakes);
        if (winner === '1') {
            return 'blue';
        }
        else if (winner === '2') {
            return 'red';
        }
        else {
            return 'orange';
        }
    }
    game.getWinnerColor = getWinnerColor;
    function shouldSlowlyAppear(row, col) {
        if (isFirstMove() || !game.currentUpdateUI.stateBeforeMove || game.reset) {
            return true;
        }
        return false;
    }
    game.shouldSlowlyAppear = shouldSlowlyAppear;
    function shouldSlowlyDisappear(row, col) {
        // if (!isFirstMove() && currentUpdateUI.stateBeforeMove && currentUpdateUI.move) {
        //   if (currentUpdateUI.stateBeforeMove.boardWithSnakes.board[row][col] !== '' &&
        //       currentUpdateUI.move.stateAfterMove.boardWithSnakes.board[row][col] === '') {
        //     log.error("true");
        //     return true;
        //   }
        // }
        return false;
    }
    game.shouldSlowlyDisappear = shouldSlowlyDisappear;
    function keyDown(keyCode) {
        // Enter to start the game or stop the game
        if (keyCode == 13) {
            if (game.currentUpdateUI.end) {
                resetEverything();
            }
            else if (game.action == null) {
                game.action = $interval(move, game.GameSpeed);
            }
            else {
                $interval.cancel(game.action);
                game.action = null;
            }
        }
        if (game.ComputerOrHuman[0] == 1) {
            // up arrow
            if (keyCode == 38) {
                if (game.snakeOneMove == null) {
                    game.snakeOneMove = { shiftX: -1, shiftY: 0 };
                }
            }
            // down arrow
            if (keyCode == 40) {
                if (game.snakeOneMove == null) {
                    game.snakeOneMove = { shiftX: 1, shiftY: 0 };
                }
            }
            // left arrow
            if (keyCode == 37) {
                if (game.snakeOneMove == null) {
                    game.snakeOneMove = { shiftX: 0, shiftY: -1 };
                }
            }
            // right arrow
            if (keyCode == 39) {
                if (game.snakeOneMove == null) {
                    game.snakeOneMove = { shiftX: 0, shiftY: 1 };
                }
            }
        }
        if (game.ComputerOrHuman[1] == 1) {
            // w
            if (keyCode == 87) {
                if (game.snakeTwoMove == null) {
                    game.snakeTwoMove = { shiftX: -1, shiftY: 0 };
                }
            }
            // s
            if (keyCode == 83) {
                if (game.snakeTwoMove == null) {
                    game.snakeTwoMove = { shiftX: 1, shiftY: 0 };
                }
            }
            // a
            if (keyCode == 65) {
                if (game.snakeTwoMove == null) {
                    game.snakeTwoMove = { shiftX: 0, shiftY: -1 };
                }
            }
            // d
            if (keyCode == 68) {
                if (game.snakeTwoMove == null) {
                    game.snakeTwoMove = { shiftX: 0, shiftY: 1 };
                }
            }
        }
        if (game.currentUpdateUI.stateBeforeMove) {
            if (game.ComputerOrHuman[0] == 1 && game.snakeOneMove != null) {
                var oldDirection = game.currentUpdateUI.stateBeforeMove.boardWithSnakes.snakes[0].currentDirection;
                if ((oldDirection.shiftX) == (game.snakeOneMove.shiftX) &&
                    (oldDirection.shiftY) == (game.snakeOneMove.shiftY)) {
                    game.snakeOneMove = null;
                }
            }
            if (game.ComputerOrHuman[1] == 1 && game.snakeTwoMove != null) {
                var oldDirection = game.currentUpdateUI.stateBeforeMove.boardWithSnakes.snakes[1].currentDirection;
                if ((oldDirection.shiftX) == (game.snakeTwoMove.shiftX) &&
                    (oldDirection.shiftY) == (game.snakeTwoMove.shiftY)) {
                    game.snakeTwoMove = null;
                }
            }
        }
    }
    game.keyDown = keyDown;
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map