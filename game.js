class BlockBuster {
    constructor() {
        this.board = [];
        this.boardSize = 6;
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.colorIcons = {
            red: '🔴',
            blue: '🔵',
            green: '🟢',
            yellow: '🟡',
            purple: '🟣',
            orange: '🟠'
        };
        this.selectedBlocks = [];
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.blockElements = new Map();
        this.messageTimeout = null;
        
        this.boardEl = document.getElementById('game-board');
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.movesEl = document.getElementById('moves');
        this.messageEl = document.getElementById('message');
        this.selectedCountEl = document.getElementById('selected-count');
        this.confirmBtn = document.getElementById('confirm-btn');
        this.instructionsModal = document.getElementById('instructions-modal');
        
        document.getElementById('confirm-btn').addEventListener('click', () => this.confirmSelection());
        document.getElementById('deselect-btn').addEventListener('click', () => this.deselectAll());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('new-game-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        this.showInstructions();
    }
    
    showInstructions() {
        this.instructionsModal.classList.remove('hidden');
    }
    
    startGame() {
        this.instructionsModal.classList.add('hidden');
        this.init();
    }
    
    init() {
        this.selectedBlocks = [];
        this.generateBoard();
        this.render();
        this.updateStats();
        this.updateSelectionInfo();
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
                    value: Math.floor(Math.random() * 5) + 1,
                    x: x,
                    y: y
                };
            }
        }
    }
    
    render() {
        this.boardEl.innerHTML = '';
        this.blockElements.clear();
        const blockSize = window.innerWidth <= 400 ? 38 : 45;
        this.boardEl.style.gridTemplateColumns = `repeat(${this.boardSize}, ${blockSize}px)`;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const block = document.createElement('div');
                block.className = 'block';
                const cell = this.board[y][x];
                
                if (cell) {
                    block.classList.add(cell.color);
                    block.innerHTML = `<span class="block-icon">${this.colorIcons[cell.color]}</span><span class="block-value">${cell.value}</span>`;
                    block.dataset.x = x;
                    block.dataset.y = y;
                    block.tabIndex = 0;
                    block.addEventListener('click', () => this.onBlockClick(x, y));
                } else {
                    block.classList.add('empty');
                }
                
                this.boardEl.appendChild(block);
                this.blockElements.set(`${x},${y}`, block);
            }
        }
    }
    
    onBlockClick(x, y) {
        const cell = this.board[y][x];
        if (!cell) return;
        
        const existingIndex = this.selectedBlocks.findIndex(b => b.x === x && b.y === y);
        
        if (existingIndex !== -1) {
            this.selectedBlocks.splice(existingIndex, 1);
        } else {
            if (this.selectedBlocks.length >= 5) {
                this.showMessage('Максимум 5 блоков!');
                return;
            }
            
            if (this.selectedBlocks.length > 0) {
                const firstColor = this.selectedBlocks[0].color;
                if (cell.color !== firstColor) {
                    this.showMessage('Выбирайте блоки одного цвета!');
                    return;
                }
            }
            
            this.selectedBlocks.push(cell);
        }
        
        this.updateSelectionVisuals();
        this.updateSelectionInfo();
    }
    
    updateSelectionVisuals() {
        this.blockElements.forEach((block, key) => {
            block.classList.remove('selected');
        });
        
        this.selectedBlocks.forEach(cell => {
            const block = this.getBlockElement(cell.x, cell.y);
            if (block) {
                block.classList.add('selected');
            }
        });
    }
    
    updateSelectionInfo() {
        this.selectedCountEl.textContent = this.selectedBlocks.length;
        this.confirmBtn.disabled = this.selectedBlocks.length < 3 || this.selectedBlocks.length > 5;
    }
    
    confirmSelection() {
        if (this.selectedBlocks.length < 3 || this.selectedBlocks.length > 5) {
            this.showMessage('Нужно от 3 до 5 блоков!');
            return;
        }
        
        const color = this.selectedBlocks[0].color;
        const allSameColor = this.selectedBlocks.every(b => b.color === color);
        
        if (!allSameColor) {
            this.showMessage('Все блоки должны быть одного цвета!');
            return;
        }
        
        this.selectedBlocks.forEach(cell => {
            this.score += cell.value * 10;
            this.board[cell.y][cell.x] = null;
            
            const block = this.getBlockElement(cell.x, cell.y);
            if (block) {
                block.classList.add('destroying');
            }
        });
        
        this.moves++;
        this.selectedBlocks = [];
        
        setTimeout(() => {
            this.dropBlocks();
            this.fillEmptySpaces();
            this.render();
            this.updateStats();
            this.updateSelectionInfo();
            this.checkWin();
        }, 300);
    }
    
    deselectAll() {
        this.selectedBlocks = [];
        this.updateSelectionVisuals();
        this.updateSelectionInfo();
    }
    
    getBlockElement(x, y) {
        return this.blockElements.get(`${x},${y}`);
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
                        value: Math.floor(Math.random() * 5) + 1,
                        x: x,
                        y: y
                    };
                }
            }
        }
    }
    
    checkWin() {
        let hasBlocks = false;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x]) {
                    hasBlocks = true;
                    break;
                }
            }
            if (hasBlocks) break;
        }
        
        if (!hasBlocks) {
            this.showMessage('Уровень пройден! 🎉');
            setTimeout(() => this.nextLevel(), 2000);
        } else {
            this.checkPossibleMoves();
        }
    }
    
    checkPossibleMoves() {
        const colorGroups = {};
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = this.board[y][x];
                if (!cell) continue;
                
                if (!colorGroups[cell.color]) {
                    colorGroups[cell.color] = [];
                }
                colorGroups[cell.color].push(cell);
            }
        }
        
        let hasPossibleMove = false;
        for (const color in colorGroups) {
            if (colorGroups[color].length >= 3) {
                hasPossibleMove = true;
                break;
            }
        }
        
        if (!hasPossibleMove) {
            this.showMessage('Нет возможных ходов! Перемешиваем...');
            setTimeout(() => {
                this.shuffleBoard();
                this.render();
            }, 1500);
        }
    }
    
    shuffleBoard() {
        const allBlocks = [];
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x]) {
                    allBlocks.push(this.board[y][x]);
                }
            }
        }
        
        for (let i = allBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
        }
        
        let index = 0;
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x]) {
                    this.board[y][x] = allBlocks[index];
                    this.board[y][x].x = x;
                    this.board[y][x].y = y;
                    index++;
                }
            }
        }
    }
    
    showHint() {
        this.clearHints();
        
        const colorGroups = {};
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = this.board[y][x];
                if (!cell) continue;
                
                if (!colorGroups[cell.color]) {
                    colorGroups[cell.color] = [];
                }
                colorGroups[cell.color].push(cell);
            }
        }
        
        for (const color in colorGroups) {
            if (colorGroups[color].length >= 3) {
                const blocksToHint = colorGroups[color].slice(0, 5);
                blocksToHint.forEach(cell => {
                    const block = this.getBlockElement(cell.x, cell.y);
                    if (block) {
                        block.classList.add('hint');
                    }
                });
                
                setTimeout(() => this.clearHints(), 2000);
                return;
            }
        }
        
        this.showMessage('Нет доступных ходов!');
    }
    
    clearHints() {
        this.boardEl.querySelectorAll('.hint').forEach(block => {
            block.classList.remove('hint');
        });
    }
    
    showMessage(text) {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        this.messageEl.textContent = text;
        this.messageEl.classList.remove('hidden');
        this.messageTimeout = setTimeout(() => this.messageEl.classList.add('hidden'), 2000);
    }
    
    nextLevel() {
        this.level++;
        this.moves = 0;
        this.selectedBlocks = [];
        this.generateBoard();
        this.render();
        this.updateStats();
        this.updateSelectionInfo();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.selectedBlocks = [];
        this.generateBoard();
        this.render();
        this.updateStats();
        this.updateSelectionInfo();
    }
    
    updateStats() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.movesEl.textContent = this.moves;
    }
    
    handleKeyDown(e) {
        if (!this.instructionsModal.classList.contains('hidden')) {
            if (e.key === 'Enter' || e.key === ' ') {
                this.startGame();
                e.preventDefault();
            }
            return;
        }
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                if (this.selectedBlocks.length >= 3) {
                    this.confirmSelection();
                }
                e.preventDefault();
                break;
            case 'Escape':
                this.deselectAll();
                e.preventDefault();
                break;
            case 'h':
                this.showHint();
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlockBuster();
});
