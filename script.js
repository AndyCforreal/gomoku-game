console.log('Loading Gomoku Game...');

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

let gameState = {
    board: [],
    currentPlayer: BLACK,
    gameOver: false,
    moveHistory: [],
    gameMode: 'normal', // 'normal' or 'challenge'
    challengeLevel: 1,
    playerColor: 'black',
    playerStone: BLACK,
    computerStone: WHITE,
    playerStarts: true,
    aiDifficulty: 3
};

const difficultySettings = {
    1: { name: '菜鳥級 AI', randomness: 0.5 },
    2: { name: '新手級 AI', randomness: 0.4 },
    3: { name: '初級 AI', randomness: 0.3 },
    4: { name: '中初級 AI', randomness: 0.2 },
    5: { name: '中級 AI', randomness: 0.15 },
    6: { name: '中高級 AI', randomness: 0.1 },
    7: { name: '高級 AI', randomness: 0.05 },
    8: { name: '專家級 AI', randomness: 0.03 },
    9: { name: '大師級 AI', randomness: 0.01 },
    10: { name: '五子棋之神', randomness: 0 }
};

function initializeGame() {
    console.log('Initializing game...');
    
    // 初始化棋盤
    gameState.board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        gameState.board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameState.board[i][j] = EMPTY;
        }
    }
    
    gameState.gameOver = false;
    gameState.moveHistory = [];
    
    // 設定先手
    if (gameState.playerStarts) {
        gameState.currentPlayer = gameState.playerStone;
        updateStatus("你的回合");
    } else {
        gameState.currentPlayer = gameState.computerStone;
        updateStatus("電腦先手，思考中...");
        setTimeout(() => {
            makeComputerMove();
        }, 1000);
    }
    
    updatePlayerInfo();
    updateChallengeInfo();
    renderBoard();
}

function renderBoard() {
    console.log('Rendering board...');
    const boardGrid = document.getElementById('boardGrid');
    boardGrid.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
            
            const cellValue = gameState.board[row][col];
            if (cellValue !== EMPTY) {
                const stone = document.createElement('div');
                stone.className = `stone ${cellValue === BLACK ? 'black' : 'white'}`;
                cell.appendChild(stone);
            }
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            boardGrid.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    console.log(`Cell clicked: ${row}, ${col}`);
    
    if (gameState.gameOver || gameState.currentPlayer !== gameState.playerStone || gameState.board[row][col] !== EMPTY) {
        console.log('Invalid move');
        return;
    }
    
    makeMove(row, col, gameState.playerStone);
    
    if (!gameState.gameOver) {
        gameState.currentPlayer = gameState.computerStone;
        updateStatus("電腦思考中...");
        
        setTimeout(() => {
            makeComputerMove();
        }, 800);
    }
}

function makeMove(row, col, player) {
    console.log(`Making move: ${row}, ${col}, player: ${player}`);
    
    gameState.board[row][col] = player;
    gameState.moveHistory.push({row, col, player});
    renderBoard();
    
    if (checkWin(row, col, player)) {
        endGame(player);
        return true;
    } else if (isBoardFull()) {
        endGame(null);
        return true;
    }
    
    return false;
}

function makeComputerMove() {
    if (gameState.gameOver) return;
    
    console.log('Computer making move...');
    
    const move = getBestMove();
    if (move) {
        makeMove(move.row, move.col, gameState.computerStone);
        
        if (!gameState.gameOver) {
            gameState.currentPlayer = gameState.playerStone;
            updateStatus("你的回合");
        }
    }
}

function getBestMove() {
    const difficulty = difficultySettings[gameState.aiDifficulty];
    
    // 隨機性
    if (Math.random() < difficulty.randomness) {
        return getRandomMove();
    }
    
    // 檢查勝利機會
    const winMove = getWinningMove(gameState.computerStone);
    if (winMove) return winMove;
    
    // 檢查防禦需要
    const blockMove = getWinningMove(gameState.playerStone);
    if (blockMove) return blockMove;
    
    // 使用評估算法
    return getBestMoveByEvaluation();
}

function getWinningMove(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] === EMPTY) {
                gameState.board[row][col] = player;
                if (checkWin(row, col, player)) {
                    gameState.board[row][col] = EMPTY;
                    return {row, col};
                }
                gameState.board[row][col] = EMPTY;
            }
        }
    }
    return null;
}

function getRandomMove() {
    const emptyCells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] === EMPTY) {
                emptyCells.push({row, col});
            }
        }
    }
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getBestMoveByEvaluation() {
    let bestScore = -1000000;
    let bestMove = null;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] === EMPTY) {
                const score = evaluatePosition(row, col);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {row, col};
                }
            }
        }
    }
    
    return bestMove;
}

function evaluatePosition(row, col) {
    let score = 0;
    
    // 評估電腦的攻擊分數
    const attackScore = calculateLineScore(row, col, gameState.computerStone);
    // 評估防禦分數
    const defenseScore = calculateLineScore(row, col, gameState.playerStone);
    
    score = attackScore + defenseScore * 1.1;
    
    // 中心位置加分
    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDistance) * 2;
    
    return score;
}

function calculateLineScore(row, col, player) {
    let totalScore = 0;
    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    
    for (let [dr, dc] of directions) {
        let count = 1;
        let blocked = 0;
        
        // 正方向
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (gameState.board[r][c] === player) {
                count++;
            } else if (gameState.board[r][c] !== EMPTY) {
                blocked++;
                break;
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
        
        // 負方向
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (gameState.board[r][c] === player) {
                count++;
            } else if (gameState.board[r][c] !== EMPTY) {
                blocked++;
                break;
            } else {
                break;
            }
            r -= dr;
            c -= dc;
        }
        
        // 根據連子數和阻擋情況評分
        if (count >= 5) {
            totalScore += 1000000;
        } else if (count === 4) {
            totalScore += blocked === 0 ? 50000 : 1000;
        } else if (count === 3) {
            totalScore += blocked === 0 ? 5000 : 100;
        } else if (count === 2) {
            totalScore += blocked === 0 ? 500 : 10;
        }
    }
    
    return totalScore;
}

function checkWin(row, col, player) {
    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    
    for (let [dr, dc] of directions) {
        let count = 1;
        const winningStones = [{row, col}];
        
        // 正方向
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameState.board[r][c] === player) {
            count++;
            winningStones.push({row: r, col: c});
            r += dr;
            c += dc;
        }
        
        // 負方向
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameState.board[r][c] === player) {
            count++;
            winningStones.push({row: r, col: c});
            r -= dr;
            c -= dc;
        }
        
        if (count >= 5) {
            highlightWinningStones(winningStones);
            return true;
        }
    }
    
    return false;
}

function highlightWinningStones(stones) {
    setTimeout(() => {
        stones.forEach(({row, col}) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell && cell.querySelector('.stone')) {
                cell.querySelector('.stone').classList.add('winning');
            }
        });
    }, 100);
}

function isBoardFull() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] === EMPTY) {
                return false;
            }
        }
    }
    return true;
}

function endGame(winner) {
    console.log('Game ended, winner:', winner);
    gameState.gameOver = true;
    
    setTimeout(() => {
        const winnerMessage = document.getElementById('winnerMessage');
        const winnerText = document.getElementById('winnerText');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        
        if (winner === gameState.playerStone) {
            winnerText.textContent = "🎉 恭喜你獲勝！";
            winnerText.className = "winner-text player-win";
            
            if (gameState.gameMode === 'challenge' && gameState.challengeLevel < 10) {
                nextLevelBtn.style.display = 'inline-block';
                winnerText.textContent += ` 準備挑戰第 ${gameState.challengeLevel + 1} 關？`;
            } else if (gameState.gameMode === 'challenge' && gameState.challengeLevel === 10) {
                winnerText.textContent = "🏆 恭喜！你已征服所有關卡，成為五子棋大師！";
                nextLevelBtn.style.display = 'none';
            }
        } else if (winner === gameState.computerStone) {
            winnerText.textContent = "💻 電腦獲勝！";
            winnerText.className = "winner-text computer-win";
            nextLevelBtn.style.display = 'none';
            
            if (gameState.gameMode === 'challenge') {
                winnerText.textContent += ` 再試一次第 ${gameState.challengeLevel} 關？`;
            }
        } else {
            winnerText.textContent = "🤝 平局！";
            winnerText.className = "winner-text draw";
            nextLevelBtn.style.display = 'none';
        }
        
        winnerMessage.style.display = 'flex';
    }, 500);
}

function updateStatus(message) {
    const status = document.getElementById('gameStatus');
    status.textContent = message;
    
    if (message.includes('你的回合')) {
        status.className = 'game-status player-turn';
    } else if (message.includes('電腦')) {
        status.className = 'game-status computer-turn';
    } else {
        status.className = 'game-status';
    }
}

function updatePlayerInfo() {
    const gameInfo = document.getElementById('gameInfo');
    if (gameState.playerStone === BLACK) {
        gameInfo.innerHTML = `
            <div class="player-info">
                <span class="player-stone black"></span>
                <span>玩家 (黑子)</span>
            </div>
            <div class="player-info">
                <span class="player-stone white"></span>
                <span>電腦 (白子)</span>
            </div>
        `;
    } else {
        gameInfo.innerHTML = `
            <div class="player-info">
                <span class="player-stone black"></span>
                <span>電腦 (黑子)</span>
            </div>
            <div class="player-info">
                <span class="player-stone white"></span>
                <span>玩家 (白子)</span>
            </div>
        `;
    }
}

function updateChallengeInfo() {
    if (gameState.gameMode === 'challenge') {
        const levelInfo = document.getElementById('challengeLevel');
        const progressInfo = document.getElementById('challengeProgress');
        const difficulty = difficultySettings[gameState.aiDifficulty];
        
        levelInfo.textContent = `第 ${gameState.challengeLevel} 關`;
        progressInfo.textContent = difficulty.name;
    }
}

function setGameMode(mode) {
    console.log('Setting game mode:', mode);
    
    gameState.gameMode = mode;
    const normalBtn = document.getElementById('normalModeBtn');
    const challengeBtn = document.getElementById('challengeModeBtn');
    const colorSelection = document.getElementById('colorSelection');
    const challengeInfo = document.getElementById('challengeInfo');
    
    if (mode === 'normal') {
        normalBtn.classList.add('active');
        challengeBtn.classList.remove('active');
        colorSelection.style.display = 'flex';
        challengeInfo.style.display = 'none';
        gameState.aiDifficulty = 5;
    } else {
        challengeBtn.classList.add('active');
        normalBtn.classList.remove('active');
        colorSelection.style.display = 'none';
        challengeInfo.style.display = 'block';
        gameState.challengeLevel = 1;
        gameState.aiDifficulty = 1;
        gameState.playerColor = 'black';
        gameState.playerStone = BLACK;
        gameState.computerStone = WHITE;
        gameState.playerStarts = true;
    }
    
    initializeGame();
}

function setPlayerColor(color) {
    if (gameState.gameMode === 'challenge') return;
    
    console.log('Setting player color:', color);
    
    gameState.playerColor = color;
    if (color === 'black') {
        gameState.playerStone = BLACK;
        gameState.computerStone = WHITE;
        gameState.playerStarts = true;
    } else {
        gameState.playerStone = WHITE;
        gameState.computerStone = BLACK;
        gameState.playerStarts = false;
    }
    initializeGame();
}

function restartGame() {
    console.log('Restarting game...');
    document.getElementById('winnerMessage').style.display = 'none';
    initializeGame();
}

function nextLevel() {
    if (gameState.challengeLevel < 10) {
        gameState.challengeLevel++;
        gameState.aiDifficulty = gameState.challengeLevel;
        document.getElementById('winnerMessage').style.display = 'none';
        initializeGame();
    }
}

function undoMove() {
    if (gameState.moveHistory.length < 2 || gameState.gameOver) return;
    
    // 撤回兩步 (玩家和電腦各一步)
    for (let i = 0; i < 2; i++) {
        const lastMove = gameState.moveHistory.pop();
        if (lastMove) {
            gameState.board[lastMove.row][lastMove.col] = EMPTY;
        }
    }
    
    gameState.currentPlayer = gameState.playerStone;
    updateStatus("你的回合");
    renderBoard();
}

// 事件綁定
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners...');
    
    // 新遊戲按鈕
    document.getElementById('newGameBtn').addEventListener('click', function() {
        console.log('New game button clicked');
        initializeGame();
    });
    
    // 悔棋按鈕
    document.getElementById('undoBtn').addEventListener('click', function() {
        console.log('Undo button clicked');
        undoMove();
    });
    
    // 模式切換按鈕
    document.getElementById('normalModeBtn').addEventListener('click', function() {
        console.log('Normal mode button clicked');
        setGameMode('normal');
    });
    
    document.getElementById('challengeModeBtn').addEventListener('click', function() {
        console.log('Challenge mode button clicked');
        setGameMode('challenge');
    });
    
    // 棋子顏色選擇
    const colorRadios = document.querySelectorAll('input[name="playerColor"]');
    colorRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            console.log('Color changed:', e.target.value);
            setPlayerColor(e.target.value);
        });
    });
    
    // 重新開始按鈕
    document.getElementById('restartGameBtn').addEventListener('click', function() {
        console.log('Restart button clicked');
        restartGame();
    });
    
    // 下一關按鈕
    document.getElementById('nextLevelBtn').addEventListener('click', function() {
        console.log('Next level button clicked');
        nextLevel();
    });
    
    // 初始化遊戲
    console.log('Starting initial game...');
    initializeGame();
});