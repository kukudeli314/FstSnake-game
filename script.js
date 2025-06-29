class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // 蛇的初始位置和方向
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;
        
        // 鼠标位置
        this.mouseX = 0;
        this.mouseY = 0;
        
        // 食物位置
        this.food = this.generateFood();
        
        // 分数
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // 游戏速度
        this.gameSpeed = 150;
        this.lastTime = 0;
        
        // DOM元素
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.restartButton = document.getElementById('restartButton');
        
        this.init();
    }
    
    init() {
        this.updateHighScore();
        this.bindEvents();
        this.draw();
    }
    
    bindEvents() {
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        // 键盘事件（保留空格键开始/暂停功能）
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // 按钮事件
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        this.pauseButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        // 触摸事件支持（移动端）
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning && e.code === 'Space') {
            e.preventDefault();
            this.startGame();
            return;
        }
        
        if (!this.gameRunning) return;
        
        // 只保留空格键暂停功能
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
        }
    }
    
    // 根据鼠标位置计算蛇的移动方向
    calculateDirection() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        const head = this.snake[0];
        const headCenterX = head.x * this.gridSize + this.gridSize / 2;
        const headCenterY = head.y * this.gridSize + this.gridSize / 2;
        
        // 计算鼠标相对于蛇头的方向
        const deltaX = this.mouseX - headCenterX;
        const deltaY = this.mouseY - headCenterY;
        
        // 如果鼠标在蛇头附近，不改变方向
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < this.gridSize) return;
        
        // 确定主要移动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平移动
            if (deltaX > 0 && this.dx !== -1) {
                this.dx = 1;
                this.dy = 0;
            } else if (deltaX < 0 && this.dx !== 1) {
                this.dx = -1;
                this.dy = 0;
            }
        } else {
            // 垂直移动
            if (deltaY > 0 && this.dy !== -1) {
                this.dx = 0;
                this.dy = 1;
            } else if (deltaY < 0 && this.dy !== 1) {
                this.dx = 0;
                this.dy = -1;
            }
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        // 设置初始移动方向（向右）
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }
        
        this.gameRunning = true;
        this.gameOver = false;
        this.gamePaused = false;
        this.hideOverlay();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        this.pauseButton.textContent = this.gamePaused ? '继续' : '暂停';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    resetGame() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.food = this.generateFood();
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.gameSpeed = 150; // 重置游戏速度
        this.updateScore();
        this.pauseButton.textContent = '暂停';
        this.showOverlay('开始游戏', '移动鼠标控制蛇的方向');
        this.draw(); // 重新绘制游戏画面
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        if (currentTime - this.lastTime > this.gameSpeed) {
            this.calculateDirection(); // 计算移动方向
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // 移动蛇
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        // 检查自身碰撞（跳过头部，因为头部会移动）
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            
            // 增加游戏速度
            if (this.score % 50 === 0 && this.gameSpeed > 50) {
                this.gameSpeed -= 10;
            }
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#2d3748';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, 
                                this.gridSize - 2, this.gridSize - 2);
                
                // 眼睛
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 4, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 4, 3, 3);
            } else {
                // 蛇身
                const alpha = 1 - (index * 0.1);
                this.ctx.fillStyle = `rgba(45, 55, 72, ${Math.max(0.3, alpha)})`;
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, 
                                this.gridSize - 2, this.gridSize - 2);
            }
        });
    }
    
    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // 添加光泽效果
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2 - 2,
            this.food.y * this.gridSize + this.gridSize / 2 - 2,
            2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
        
        this.showOverlay('游戏结束', `最终得分: ${this.score}`);
    }
    
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.gameOverlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.gameOverlay.classList.add('hidden');
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 