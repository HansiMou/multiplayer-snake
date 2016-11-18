var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 30;
    gameLogic.COLS = 30;
    gameLogic.NumberOfBarrier = 5;
    gameLogic.NumberOfPlayer = 2;
    gameLogic.NumberOfFood = 3;
    gameLogic.RemainingTime = 180 * 1000;
    function getInitialBoardAndSnakes() {
        var board = getInitialBoardWithBarriersAndFoods();
        var snakes = [];
        for (var i = 0; i < gameLogic.NumberOfPlayer; i++) {
            snakes[i] = getInitialSnake(board, i + 1);
        }
        return { board: board, snakes: snakes };
    }
    function getInitialBoardWithBarriersAndFoods() {
        var board = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            board[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                board[i][j] = '';
            }
        }
        var curBarriers = 0;
        var curFoods = 0;
        while (curBarriers < gameLogic.NumberOfBarrier || curFoods < gameLogic.NumberOfFood) {
            var randomX = Math.floor((Math.random() * gameLogic.ROWS));
            var randomY = Math.floor((Math.random() * gameLogic.COLS));
            if (board[randomX][randomY] == '') {
                if (curBarriers < gameLogic.NumberOfBarrier) {
                    board[randomX][randomY] = 'BARRIER';
                    curBarriers++;
                }
                else {
                    board[randomX][randomY] = 'FOOD';
                    curFoods++;
                }
            }
        }
        return board;
    }
    // side effect: update the board with snake
    function getInitialSnake(board, player) {
        var snake = { headToTail: [], dead: false, oldTail: null, currentDirection: null };
        var found = false;
        while (!found) {
            var randomX = Math.floor((Math.random() * gameLogic.ROWS) + 1);
            var randomY = Math.floor((Math.random() * gameLogic.COLS) + 1);
            if (board[randomX][randomY] === '') {
                snake.headToTail = [{ row: randomX, col: randomY }];
                found = true;
                if (isBarrierOrBorderOrOpponentOrMySelf(randomX + 1, randomY, board)) {
                    snake.currentDirection = { shiftX: 1, shiftY: 0 };
                }
                else if (isBarrierOrBorderOrOpponentOrMySelf(randomX - 1, randomY, board)) {
                    snake.currentDirection = { shiftX: -1, shiftY: 0 };
                }
                else if (isBarrierOrBorderOrOpponentOrMySelf(randomX, randomY + 1, board)) {
                    snake.currentDirection = { shiftX: 0, shiftY: 1 };
                }
                else if (isBarrierOrBorderOrOpponentOrMySelf(randomX, randomY - 1, board)) {
                    snake.currentDirection = { shiftX: 0, shiftY: -1 };
                }
                else {
                    found = false;
                    snake.headToTail = [];
                }
            }
        }
        board[snake.headToTail[0].row][snake.headToTail[0].col] = "SNAKE" + player;
        return snake;
    }
    function isBarrierOrBorderOrOpponentOrMySelf(x, y, board) {
        if (x < 0 || x >= gameLogic.ROWS || y < 0 || y >= gameLogic.COLS) {
            return true;
        }
        if (board[x][y] != '' || board[x][y] != 'FOOD') {
            return true;
        }
        return false;
    }
    function getInitialState() {
        return { boardWithSnakes: getInitialBoardAndSnakes(), newDirections: [] };
    }
    gameLogic.getInitialState = getInitialState;
    // return true if two snakes bump against each other
    // or if time is out and both snake have equal length
    function isTie(boardWithSnakes, time) {
        var allDead = true;
        for (var _i = 0, _a = boardWithSnakes.snakes; _i < _a.length; _i++) {
            var snake = _a[_i];
            if (!snake.dead) {
                allDead = false;
            }
        }
        if (allDead) {
            return true;
        }
        if (time <= 0) {
            var isTie_1 = true;
            for (var i = 0; i < boardWithSnakes.snakes.length - 1; i++) {
                if (boardWithSnakes.snakes[i].headToTail.length != boardWithSnakes.snakes[i + 1].headToTail.length) {
                    isTie_1 = false;
                }
            }
            return isTie_1;
        }
        return false;
    }
    // return the only one player that has live snake, '', '1', '2'
    function getWinner(boardWithSnakes) {
        var winner = '';
        var countOfLiveSnake = 0;
        for (var i = 0; i < boardWithSnakes.snakes.length; i++) {
            if (!boardWithSnakes.snakes[i].dead) {
                countOfLiveSnake++;
                winner = i + 1 + '';
            }
        }
        if (countOfLiveSnake != 1) {
            winner = '';
        }
        return winner;
    }
    /**
     * Returns the move that should be performed when player
     * with index turnIndexBeforeMove makes a move in cell row X col.
     */
    function createMove(stateBeforeMove, newDirections, leftTime, turnIndexBeforeMove) {
        var end = false;
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var boardWithSnakes = stateBeforeMove.boardWithSnakes;
        if (getWinner(boardWithSnakes) !== '' || isTie(boardWithSnakes, leftTime)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        var boardWithSnakesAfterMove = angular.copy(boardWithSnakes);
        // Game over, time out.
        if (leftTime <= 0) {
            end = true;
        }
        else {
            // still have time
            // update snake body depending on get food or not
            for (var index = 0; index < newDirections.length; index++) {
                // pass dead snake
                if (boardWithSnakesAfterMove.snakes[index].dead) {
                    continue;
                }
                var head = boardWithSnakesAfterMove.snakes[index].headToTail[0];
                var newHeadX = void 0;
                var newHeadY = void 0;
                if (newDirections[index] == null) {
                    // keep moving in the same direction
                    newHeadX = head.row + boardWithSnakesAfterMove.snakes[index].currentDirection.shiftX;
                    newHeadY = head.col + boardWithSnakesAfterMove.snakes[index].currentDirection.shiftY;
                }
                else {
                    // keep moving in the new direction
                    newHeadX = head.row + newDirections[index].shiftX;
                    newHeadY = head.col + newDirections[index].shiftY;
                }
                // eat food
                boardWithSnakesAfterMove.snakes[index].headToTail.unshift({ row: newHeadX, col: newHeadY });
                if (boardWithSnakesAfterMove.board[newHeadX][newHeadY] != 'FOOD') {
                    // remove old tail
                    boardWithSnakesAfterMove.snakes[index].oldTail = boardWithSnakesAfterMove.snakes[index].headToTail.pop();
                }
            }
            // update dead info if snake bump into border, barrier or itself or other snakes
            for (var index = 0; index < boardWithSnakesAfterMove.snakes.length; index++) {
                var board = boardWithSnakesAfterMove.board;
                var snake = boardWithSnakesAfterMove.snakes[index];
                var head = snake.headToTail[0];
                // bump into border
                if (head.row < 0 || head.row >= gameLogic.ROWS || head.col < 0 || head.col >= gameLogic.COLS) {
                    snake.dead = true;
                    log.log("dead because bump into border");
                    continue;
                }
                // bump into barrier
                if (board[head.row][head.col] === 'BARRIER') {
                    snake.dead = true;
                    log.log("dead because bump into barrier");
                    continue;
                }
                // bump into itself
                for (var i = 1; i < snake.headToTail.length; i++) {
                    if (snake.headToTail[i].row == head.row && snake.headToTail[i].col == head.col) {
                        snake.dead = true;
                        break;
                    }
                }
                // bump into others
                outer: for (var secondIndex = 0; secondIndex < boardWithSnakesAfterMove.snakes.length; secondIndex++) {
                    if (secondIndex != index) {
                        var anotherSnake = boardWithSnakesAfterMove.snakes[secondIndex];
                        for (var j = 0; j < anotherSnake.headToTail.length; j++) {
                            if (anotherSnake.headToTail[j].row == head.row && anotherSnake.headToTail[j].col == head.col) {
                                snake.dead = true;
                                break outer;
                            }
                        }
                    }
                }
            }
            updateBoardWithSnakes(boardWithSnakesAfterMove);
            log.info("I'm in after", boardWithSnakesAfterMove.board[boardWithSnakesAfterMove.snakes[0].headToTail[0].row][boardWithSnakesAfterMove.snakes[0].headToTail[0].col]);
        }
        var winner = getWinner(boardWithSnakesAfterMove);
        var matchScores = [];
        if (winner !== '' || isTie(boardWithSnakesAfterMove, leftTime)) {
            for (var _i = 0, _a = boardWithSnakesAfterMove.snakes; _i < _a.length; _i++) {
                var snake = _a[_i];
                matchScores.push(snake.headToTail.length);
            }
            end = true;
        }
        var stateAfterMove = { newDirections: newDirections, boardWithSnakes: boardWithSnakesAfterMove };
        return { matchScores: matchScores, stateAfterMove: stateAfterMove, end: end, turnIndexAfterMove: gameLogic.NumberOfPlayer - 1 - turnIndexBeforeMove };
    }
    gameLogic.createMove = createMove;
    function updateBoardWithSnakes(boardWithSnakes) {
        var foodEaten = 0;
        for (var i = 0; i < boardWithSnakes.snakes.length; i++) {
            var snake = boardWithSnakes.snakes[i];
            if (!snake.dead) {
                // remove old tail
                if (snake.oldTail != null) {
                    log.info("I'm in old tail", snake.oldTail);
                    boardWithSnakes.board[snake.oldTail.row][snake.oldTail.col] = '';
                }
                if (boardWithSnakes.board[snake.headToTail[0].row][snake.headToTail[0].col] === 'FOOD') {
                    foodEaten++;
                }
                // add new head
                boardWithSnakes.board[snake.headToTail[0].row][snake.headToTail[0].col] = "SNAKE" + (i + 1);
                log.info("I'm in new head", snake.headToTail[0].row, snake.headToTail[0].col, boardWithSnakes.board[snake.headToTail[0].row][snake.headToTail[0].col]);
            }
        }
        fillBoardWithFood(boardWithSnakes, foodEaten);
    }
    function fillBoardWithFood(boardWithSnakes, foodEaten) {
        while (foodEaten > 0) {
            var randomX = Math.floor((Math.random() * gameLogic.ROWS) + 1);
            var randomY = Math.floor((Math.random() * gameLogic.COLS) + 1);
            if (boardWithSnakes.board[randomX][randomY] === '') {
                boardWithSnakes.board[randomX][randomY] = 'FOOD';
                foodEaten--;
            }
        }
    }
    function createInitialMove() {
        return { matchScores: [], stateAfterMove: getInitialState(), end: false, turnIndexAfterMove: 0 };
    }
    gameLogic.createInitialMove = createInitialMove;
    function checkMoveOk(stateTransition) {
    }
    gameLogic.checkMoveOk = checkMoveOk;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map