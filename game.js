class BlockBuster {
    constructor() {
        this.board = [];
        this.boardSize = 6;
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.selectedBlock = null;
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.hintsUsed = 0;
        
        this.boardEl = document.getElementById('game-board');
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.movesEl = document.getElementById('moves');
        this.messageEl = document.getElementById('message');
        this.hintsCountEl = document.getElementById('hints-count');
        
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('new-game-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        this.init();
    }
    
    init() {
        this.generateBoard();
        this.render();
        this.updateStats();
    }
    
    generateBoard() {
        this.board = [];
        const size = Math.min(6 + Math.floor(this.level / 3), 9);
        this.boardSize = size;
        
        for (let y = 0; y < size; y++) {
            this.board[y] = [];
            for (let x = 0; x < size; x++) {
                const colorIndex = Math.floor(Math.random() * this.colors.length);
                this.board[y][x] = {
                    color: this.colors[colorIndex],
                    value: Math.floor(Math.random() * 5) + 1
                };
            }
        }
    }
    
    render() {
        this.boardEl.innerHTML = '';
        const blockSize = window.innerWidth <= 400 ? 38 : 45;
        this.boardEl.style.gridTemplateColumns = `repeat(${this.boardSize}, ${blockSize}px)`;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const block = document.createElement('div');
                block.className = 'block';
                const cell = this.board[y][x];
                
                if (cell) {
                    block.classList.add(cell.color);
                    block.textContent = cell.value;
                    block.dataset.x = x;
                    block.dataset.y = y;
                    block.addEventListener('click', () => this.onBlockClick(x, y));
                } else {
                    block.classList.add('empty');
                }
                
                this.boardEl.appendChild(block);
            }
        }
    }
    
    onBlockClick(x, y) {
        const cell = this.board[y][x];
        if (!cell) return;
        
        if (this.selectedBlock) {
            const prev = this.selectedBlock;
            
            if (prev.x === x && prev.y === y) {
                this.deselectBlock();
                return;
            }
            
            if (this.isAdjacent(prev.x, prev.y, x, y)) {
                this.swapBlocks(prev.x, prev.y, x, y);
                this.deselectBlock();
                this.moves++;
                this.updateStats();
                this.checkWin();
            } else {
                this.deselectBlock();
                this.selectBlock(x, y);
            }
        } else {
            this.selectBlock(x, y);
        }
    }
    
    selectBlock(x, y) {
        this.selectedBlock = { x, y };
        const block = this.getBlockElement(x, y);
        if (block) block.classList.add('selected');
    }
    
    deselectBlock() {
        if (this.selectedBlock) {
            const block = this.getBlockElement(this.selectedBlock.x, this.selectedBlock.y);
            if (block) block.classList.remove('selected');
            this.selectedBlock = null;
        }
    }
    
    getBlockElement(x, y) {
        return this.boardEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    }
    
    isAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
    
    swapBlocks(x1, y1, x2, y2) {
        const temp = this.board[y1][x1];
        this.board[y1][x1] = this.board[y2][x2];
        this.board[y2][x2] = temp;
        
        this.processMatches();
        this.render();
    }
    
    processMatches() {
        let found = true;
        while (found) {
            found = false;
            const toDestroy = new Set();
            
            for (let y = 0; y < this.boardSize; y++) {
                for (let x = 0; x < this.boardSize; x++) {
                    const cell = this.board[y][x];
                    if (!cell) continue;
                    
                    const matches = this.findMatches(x, y, cell.color);
                    if (matches.length >= 3) {
                        matches.forEach(m => toDestroy.add(`${m.x},${m.y}`));
                        found = true;
                    }
                }
            }
            
            if (found) {
                toDestroy.forEach(key => {
                    const [x, y] = key.split(',').map(Number);
                    this.score += this.board[y][x].value * 10;
                    this.board[y][x] = null;
                });
                
                this.dropBlocks();
                this.fillEmptySpaces();
                this.updateStats();
            }
        }
    }
    
    findMatches(startX, startY, color) {
        const matches = [];
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) continue;
            
            const cell = this.board[y][x];
            if (!cell || cell.color !== color) continue;
            
            visited.add(key);
            matches.push({x, y});
            
            queue.push({x: x-1, y});
            queue.push({x: x+1, y});
            queue.push({x, y: y-1});
            queue.push({x, y: y+1});
        }
        
        return matches;
    }
    
    dropBlocks() {
        for (let x = 0; x < this.boardSize; x++) {
            let writePos = this.boardSize - 1;
            
            for (let y = this.boardSize - 1; y >= 0; y--) {
                if (this.board[y][x]) {
                    this.board[writePos][x] = this.board[y][x];
                    if (writePos !== y) {
                        this.board[y][x] = null;
                    }
                    writePos--;
                }
            }
            
            for (let y = writePos; y >= 0; y--) {
                this.board[y][x] = null;
            }
        }
    }
    
    fillEmptySpaces() {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (!this.board[y][x]) {
                    const colorIndex = Math.floor(Math.random() * this.colors.length);
                    this.board[y][x] = {
                        color: this.colors[colorIndex],
                        value: Math.floor(Math.random() * 5) + 1
                    };
                }
            }
        }
    }
    
    showHint() {
        this.clearHints();
        
        const bestMove = this.findBestMove();
        if (bestMove) {
            const block1 = this.getBlockElement(bestMove.x1, bestMove.y1);
            const block2 = this.getBlockElement(bestMove.x2, bestMove.y2);
            
            if (block1) block1.classList.add('hint');
            if (block2) block2.classList.add('hint');
            
            this.hintsUsed++;
            this.hintsCountEl.textContent = '∞';
            
            setTimeout(() => this.clearHints(), 2000);
        }
    }
    
    clearHints() {
        this.boardEl.querySelectorAll('.hint').forEach(block => {
            block.classList.remove('hint');
        });
    }
    
    findBestMove() {
        let bestMove = null;
        let bestScore = -1;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (!this.board[y][x]) continue;
                
                const directions = [
                    {dx: 1, dy: 0},
                    {dx: 0, dy: 1}
                ];
                
                for (const dir of directions) {
                    const nx = x + dir.dx;
                    const ny = y + dir.dy;
                    
                    if (nx >= this.boardSize || ny >= this.boardSize) continue;
                    if (!this.board[ny][nx]) continue;
                    
                    this.swapBlocksSilent(x, y, nx, ny);
                    const score = this.calculateMoveScore();
                    this.swapBlocksSilent(x, y, nx, ny);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {x1: x, y1: y, x2: nx, y2: ny};
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    swapBlocksSilent(x1, y1, x2, y2) {
        const temp = this.board[y1][x1];
        this.board[y1][x1] = this.board[y2][x2];
        this.board[y2][x2] = temp;
    }
    
    calculateMoveScore() {
        let score = 0;
        const visited = new Set();
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const key = `${x},${y}`;
                if (visited.has(key)) continue;
                
                const cell = this.board[y][x];
                if (!cell) continue;
                
                const matches = this.findMatches(x, y, cell.color);
                if (matches.length >= 3) {
                    matches.forEach(m => visited.add(`${m.x},${m.y}`));
                    score += matches.length * 10;
                }
            }
        }
        
        return score;
    }
    
    checkWin() {
        let hasMatches = false;
        const visited = new Set();
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const key = `${x},${y}`;
                if (visited.has(key)) continue;
                
                const cell = this.board[y][x];
                if (!cell) continue;
                
                const matches = this.findMatches(x, y, cell.color);
                if (matches.length >= 3) {
                    hasMatches = true;
                    matches.forEach(m => visited.add(`${m.x},${m.y}`));
                }
            }
        }
        
        if (!hasMatches && this.moves >= 3) {
            this.showMessage('Уровень пройден! 🎉');
            setTimeout(() => this.nextLevel(), 2000);
        }
    }
    
    showMessage(text) {
        this.messageEl.textContent = text;
        this.messageEl.classList.remove('hidden');
        setTimeout(() => this.messageEl.classList.add('hidden'), 2000);
    }
    
    nextLevel() {
        this.level++;
        this.moves = 0;
        this.generateBoard();
        this.render();
        this.updateStats();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.hintsUsed = 0;
        this.generateBoard();
        this.render();
        this.updateStats();
    }
    
    updateStats() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.movesEl.textContent = this.moves;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlockBuster();
});
