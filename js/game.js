class PixelMaze {
    constructor(canvas, size = 16) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = size;
        this.tileSize = Math.floor(canvas.width / size);
        this.player = { x: 1, y: 1 };
        this.goal = { x: size - 2, y: size - 2 };
        this.maze = this.generateMaze();
        this.colors = {
            wall: '#0a0521',
            path: '#1a1141',
            player: '#ff71ce',
            goal: '#01cdfe',
            trail: 'rgba(185, 103, 255, 0.3)'
        };
        this.trail = [];
        this.won = false;
        this.level = 1;
        this.winTimeout = null;
        this.gameStarted = false;
        this.buttonHovered = false;
        this.touchStartX = null;
        this.touchStartY = null;
        
        // Обработчик клавиш
        document.addEventListener('keydown', (e) => {
            // Предотвращаем скролл страницы при использовании стрелок
            if([37, 38, 39, 40].indexOf(e.keyCode) > -1 || 
               ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            this.handleKeyPress(e);
        });

        // Добавляем обработчики сенсорных событий
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Предотвращаем скролл страницы при свайпах в игре
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.gameStarted) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Отображаем стартовый экран
        this.showStartScreen();
        
        // Обработчик движений мыши для кнопки
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameStarted) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Проверяем наведение на кнопку START
                const buttonX = this.canvas.width / 2 - 60;
                const buttonY = this.canvas.height / 2 + 100;
                const wasHovered = this.buttonHovered;
                
                this.buttonHovered = (x >= buttonX && x <= buttonX + 120 && 
                                    y >= buttonY && y <= buttonY + 40);
                
                // Перерисовываем экран только если состояние кнопки изменилось
                if (wasHovered !== this.buttonHovered) {
                    this.showStartScreen();
                }
            }
        });
        
        // Обработчик кликов для стартового экрана
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameStarted) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Проверяем клик по кнопке START
                const buttonX = this.canvas.width / 2 - 60;
                const buttonY = this.canvas.height / 2 + 100;
                if (x >= buttonX && x <= buttonX + 120 && 
                    y >= buttonY && y <= buttonY + 40) {
                    this.startGame();
                }
            }
        });
    }

    showStartScreen() {
        // Очищаем canvas
        this.ctx.fillStyle = this.colors.wall;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Добавляем пиксельную сетку для фона
        this.ctx.fillStyle = 'rgba(26, 17, 65, 0.15)';
        const gridSize = 10;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                if (Math.random() > 0.85) {
                    this.ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }

        // Рисуем пиксельный логотип (упрощенная буква B)
        const logoSize = 40;
        const logoX = this.canvas.width / 2 - 80;
        const logoY = this.canvas.height / 2 - 100;
        
        // Рисуем фон логотипа
        this.ctx.fillStyle = this.colors.player;
        this.ctx.fillRect(logoX, logoY, logoSize, logoSize);
        
        // Рисуем детали логотипа
        this.ctx.fillStyle = this.colors.wall;
        this.ctx.fillRect(logoX + 15, logoY + 10, logoSize - 25, logoSize - 20);
        
        // Добавляем свечение для логотипа
        this.ctx.shadowColor = this.colors.player;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = this.colors.player;
        this.ctx.fillRect(logoX, logoY, logoSize, logoSize);
        this.ctx.shadowBlur = 0;

        // Рисуем название игры
        this.ctx.font = '28px "Press Start 2P"';
        this.ctx.fillStyle = this.colors.player;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Добавляем свечение для текста
        this.ctx.shadowColor = this.colors.player;
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('BYTERIA', this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.fillText('LAB', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.shadowBlur = 0;

        // Текст инструкции сразу после названия
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = this.colors.goal;
        this.ctx.fillText('Use arrow keys to navigate', this.canvas.width / 2, this.canvas.height / 2 + 20);

        // Рисуем пиксельные нейронные связи
        this.ctx.strokeStyle = this.colors.goal;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const startX = Math.random() * this.canvas.width;
            const startY = Math.random() * this.canvas.height;
            const endX = Math.random() * this.canvas.width;
            const endY = Math.random() * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Добавляем узлы на концах
            this.ctx.fillStyle = this.colors.goal;
            this.ctx.beginPath();
            this.ctx.arc(startX, startY, 3, 0, Math.PI * 2);
            this.ctx.arc(endX, endY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Рисуем стрелки управления
        const arrowSize = 12;
        const arrowSpacing = 20;
        const centerX = this.canvas.width / 2;
        
        // Вычисляем позицию стрелок посередине между инструкцией и кнопкой START
        const instructionY = this.canvas.height / 2 + 20; // Позиция текста инструкции
        const startButtonY = this.canvas.height / 2 + 100;     // Позиция кнопки START
        const arrowsStartY = instructionY + (startButtonY - instructionY) / 2; // Середина между инструкцией и кнопкой
        
        // Функция для рисования стрелки
        const drawArrow = (x, y, rotation) => {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotation * Math.PI / 180);
            
            // Рисуем стрелку
            this.ctx.fillStyle = this.colors.goal;
            this.ctx.beginPath();
            this.ctx.moveTo(-arrowSize/2, arrowSize/2);
            this.ctx.lineTo(0, -arrowSize/2);
            this.ctx.lineTo(arrowSize/2, arrowSize/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        };
        
        // Рисуем четыре стрелки
        drawArrow(centerX, arrowsStartY - arrowSpacing, 0);  // Вверх
        drawArrow(centerX - arrowSpacing, arrowsStartY, 90); // Влево
        drawArrow(centerX + arrowSpacing, arrowsStartY, -90); // Вправо
        drawArrow(centerX, arrowsStartY + arrowSpacing, 180); // Вниз
        
        // Демонстрация элементов игры (в углах)
        const margin = 30; // Отступ от краев
        const demoSize = 15; // Размер квадратов
        
        // Левый нижний угол - START
        this.ctx.fillStyle = this.colors.player;
        this.ctx.fillRect(margin, this.canvas.height - margin - demoSize, demoSize, demoSize);
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillStyle = this.colors.player;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('START', margin, this.canvas.height - margin + 15);
        
        // Правый нижний угол - GOAL
        this.ctx.fillStyle = this.colors.goal;
        this.ctx.fillRect(this.canvas.width - margin - demoSize, this.canvas.height - margin - demoSize, demoSize, demoSize);
        this.ctx.fillStyle = this.colors.goal;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('GOAL', this.canvas.width - margin, this.canvas.height - margin + 15);

        // Рисуем кнопку START
        const buttonX = this.canvas.width / 2 - 60;
        const buttonY = this.canvas.height / 2 + 100;
        
        // Добавляем пиксельную рамку для кнопки
        this.ctx.fillStyle = this.buttonHovered ? this.colors.player : this.colors.path;
        this.ctx.fillRect(buttonX, buttonY, 120, 40);
        
        // Добавляем пиксельный узор на кнопке
        this.ctx.fillStyle = this.buttonHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        for (let x = buttonX; x < buttonX + 120; x += 4) {
            for (let y = buttonY; y < buttonY + 40; y += 4) {
                if (Math.random() > 0.8) {
                    this.ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        // Рамка кнопки с эффектом свечения при наведении
        this.ctx.strokeStyle = this.colors.player;
        this.ctx.lineWidth = 2;
        if (this.buttonHovered) {
            this.ctx.shadowColor = this.colors.player;
            this.ctx.shadowBlur = 15;
        }
        this.ctx.strokeRect(buttonX, buttonY, 120, 40);
        this.ctx.shadowBlur = 0;
        
        // Текст кнопки
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = this.buttonHovered ? this.colors.wall : this.colors.player;
        this.ctx.textAlign = 'center';
        this.textBaseline = 'middle';
        this.ctx.fillText('START', this.canvas.width / 2, buttonY + 20);
    }

    startGame() {
        this.gameStarted = true;
        this.level = 1;
        this.size = 16;
        this.tileSize = Math.floor(this.canvas.width / this.size);
        this.player = { x: 1, y: 1 };
        this.goal = { x: this.size - 2, y: this.size - 2 };
        this.maze = this.generateMaze();
        this.trail = [];
        this.won = false;
        if (this.winTimeout) {
            clearTimeout(this.winTimeout);
        }
        this.draw();
    }

    generateMaze() {
        // Создаем сетку со стенами
        let maze = Array(this.size).fill().map(() => Array(this.size).fill(1));
        
        // Рекурсивное создание путей
        const carve = (x, y) => {
            maze[y][x] = 0;
            
            // Направления: вверх, право, вниз, влево
            const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]];
            this.shuffleArray(directions);
            
            for (let [dx, dy] of directions) {
                let newX = x + dx;
                let newY = y + dy;
                
                if (newX > 0 && newX < this.size - 1 && newY > 0 && newY < this.size - 1 
                    && maze[newY][newX] === 1) {
                    maze[y + dy/2][x + dx/2] = 0;
                    carve(newX, newY);
                }
            }
        };
        
        // Начинаем с начальной точки
        carve(1, 1);
        
        // Гарантируем путь к цели
        let x = this.goal.x;
        let y = this.goal.y;
        maze[y][x] = 0;
        
        // Создаем путь от цели к ближайшему проходу
        while (maze[y][x-1] === 1 && maze[y-1][x] === 1 && maze[y+1][x] === 1 && maze[y][x+1] === 1) {
            let direction = Math.floor(Math.random() * 4);
            switch(direction) {
                case 0: // влево
                    if (x > 1) {
                        maze[y][x-1] = 0;
                        x--;
                    }
                    break;
                case 1: // вверх
                    if (y > 1) {
                        maze[y-1][x] = 0;
                        y--;
                    }
                    break;
                case 2: // вправо
                    if (x < this.size-2) {
                        maze[y][x+1] = 0;
                        x++;
                    }
                    break;
                case 3: // вниз
                    if (y < this.size-2) {
                        maze[y+1][x] = 0;
                        y++;
                    }
                    break;
            }
        }
        
        return maze;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    handleKeyPress(e) {
        if (!this.gameStarted || this.won) return;
        this.movePlayer(e.key);
    }

    draw() {
        // Очищаем canvas
        this.ctx.fillStyle = this.colors.wall;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Вычисляем отступы для центрирования лабиринта
        const mazeWidth = this.size * this.tileSize;
        const mazeHeight = this.size * this.tileSize;
        const offsetX = (this.canvas.width - mazeWidth) / 2;
        const offsetY = (this.canvas.height - mazeHeight) / 2;
        
        // Рисуем лабиринт
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.maze[y][x] === 0) {
                    this.ctx.fillStyle = this.colors.path;
                    this.ctx.fillRect(
                        offsetX + x * this.tileSize,
                        offsetY + y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
        
        // Рисуем след
        this.trail.forEach(pos => {
            this.ctx.fillStyle = this.colors.trail;
            this.ctx.fillRect(
                offsetX + pos.x * this.tileSize,
                offsetY + pos.y * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        });
        
        // Рисуем цель
        this.ctx.fillStyle = this.colors.goal;
        this.ctx.fillRect(
            offsetX + this.goal.x * this.tileSize,
            offsetY + this.goal.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
        
        // Рисуем игрока
        this.ctx.fillStyle = this.colors.player;
        this.ctx.fillRect(
            offsetX + this.player.x * this.tileSize,
            offsetY + this.player.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );

        // Добавляем свечение для игрока
        this.ctx.shadowColor = this.colors.player;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(
            offsetX + this.player.x * this.tileSize,
            offsetY + this.player.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
        this.ctx.shadowBlur = 0;

        // Отображаем текущий уровень
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = this.colors.goal;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(`LEVEL ${this.level}`, 20, this.canvas.height - 20);

        // Отображаем подсказку по управлению
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('← ↑ → ↓', this.canvas.width - 20, this.canvas.height - 20);
    }

    onWin() {
        // Очищаем предыдущий таймаут, если есть
        if (this.winTimeout) {
            clearTimeout(this.winTimeout);
        }

        // Создаем анимацию победы
        const particles = [];
        const messages = ["LEVEL COMPLETE!", "GREAT JOB!", "NEXT LEVEL →"];
        let currentMessage = messages[Math.floor(Math.random() * messages.length)];
        
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: this.player.x * this.tileSize + this.tileSize / 2,
                y: this.player.y * this.tileSize + this.tileSize / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1,
                color: [this.colors.player, this.colors.goal, '#b967ff'][Math.floor(Math.random() * 3)]
            });
        }

        // Анимация частиц
        const animate = () => {
            this.ctx.fillStyle = this.colors.wall;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Обновляем и рисуем частицы
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life *= 0.95;

                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.life;
                this.ctx.fillRect(p.x, p.y, 3, 3);
            });

            this.ctx.globalAlpha = 1;

            // Отображаем сообщение о победе
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillStyle = this.colors.goal;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(currentMessage, this.canvas.width / 2, this.canvas.height / 2);

            // Продолжаем анимацию, если частицы еще живы
            if (particles.some(p => p.life > 0.01)) {
                requestAnimationFrame(animate);
            } else {
                // Переходим на следующий уровень
                this.level++;
                // Увеличиваем размер лабиринта каждые 3 уровня
                if (this.level % 3 === 0 && this.size < 32) {
                    this.size += 4;
                }
                this.tileSize = Math.floor(this.canvas.width / this.size);
                this.player = { x: 1, y: 1 };
                this.goal = { x: this.size - 2, y: this.size - 2 };
                this.maze = this.generateMaze();
                this.trail = [];
                this.won = false;
                this.draw();
            }
        };

        animate();
    }

    reset() {
        this.level = 1;
        this.size = 16;
        this.tileSize = Math.floor(this.canvas.width / this.size);
        this.player = { x: 1, y: 1 };
        this.goal = { x: this.size - 2, y: this.size - 2 };
        this.maze = this.generateMaze();
        this.trail = [];
        this.won = false;
        if (this.winTimeout) {
            clearTimeout(this.winTimeout);
        }
        this.draw();
    }

    // Добавляем метод для обработки движения игрока
    movePlayer(direction) {
        if (this.won) return;

        let newX = this.player.x;
        let newY = this.player.y;

        switch (direction) {
            case 'ArrowLeft':
            case 'a':
                newX--;
                break;
            case 'ArrowRight':
            case 'd':
                newX++;
                break;
            case 'ArrowUp':
            case 'w':
                newY--;
                break;
            case 'ArrowDown':
            case 's':
                newY++;
                break;
        }

        // Проверяем возможность хода
        if (newX >= 0 && newX < this.size && 
            newY >= 0 && newY < this.size && 
            this.maze[newY][newX] === 0) {
            
            // Добавляем текущую позицию в след
            this.trail.push({...this.player});
            
            // Обновляем позицию игрока
            this.player.x = newX;
            this.player.y = newY;
            
            // Проверяем достижение цели
            if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
                this.won = true;
                this.onWin();
            }
            
            this.draw();
        }
    }

    handleTouchStart(e) {
        e.preventDefault(); // Prevent default touch behavior
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;

        // Проверяем клик по кнопке START на мобильных
        if (!this.gameStarted) {
            const x = (touch.clientX - rect.left) * scale;
            const y = (touch.clientY - rect.top) * scale;
            
            const buttonX = this.canvas.width / 2 - 60;
            const buttonY = this.canvas.height / 2 + 100;
            if (x >= buttonX && x <= buttonX + 120 && 
                y >= buttonY && y <= buttonY + 40) {
                this.startGame();
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault(); // Prevent default touch behavior
        if (!this.touchStartX || !this.touchStartY || !this.gameStarted) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const minSwipe = 20; // Уменьшаем минимальное расстояние свайпа для большей отзывчивости

        // Определяем направление свайпа
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Горизонтальный свайп
            if (Math.abs(deltaX) > minSwipe) {
                if (deltaX > 0) {
                    this.movePlayer('ArrowRight');
                } else {
                    this.movePlayer('ArrowLeft');
                }
            }
        } else {
            // Вертикальный свайп
            if (Math.abs(deltaY) > minSwipe) {
                if (deltaY > 0) {
                    this.movePlayer('ArrowDown');
                } else {
                    this.movePlayer('ArrowUp');
                }
            }
        }

        // Сброс начальных координат
        this.touchStartX = null;
        this.touchStartY = null;
    }
}

// Экспортируем класс
window.PixelMaze = PixelMaze; 