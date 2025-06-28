// game.js - El Último Ron Game Logic

class ElUltimoRonGame {
    constructor() {
        console.log('🍺 Inicializando El Último Ron...');
        
        // Estados básicos del juego
        this.health = 100;
        this.intoxication = 0;
        this.rumLevel = 100;
        this.timeLeft = 180;
        this.gameRunning = false;
        this.soundEnabled = true;
        this.audioContext = null;
        
        // Sistema de niveles
        this.currentLevel = 1;
        this.levelSettings = {
            1: { 
                time: 180, healthRegen: 4, intoxAccumulation: 2, startHealth: 100,
                maxWaterLemon: 12, maxFoodEgg: 4
            },
            2: { 
                time: 150, healthRegen: 3, intoxAccumulation: 3, startHealth: 80,
                maxWaterLemon: 8, maxFoodEgg: 3
            },
            3: { 
                time: 120, healthRegen: 2, intoxAccumulation: 4, startHealth: 60,
                maxWaterLemon: 5, maxFoodEgg: 1
            }
        };
        
        // Contadores de usos por nivel
        this.waterLemonUsed = 0;
        this.foodEggUsed = 0;
        
        // Cooldowns para nuevos ítems
        this.foodCooldown = 0;
        this.foodCooldownMax = 10;
        
        // Sistema de eventos
        this.policeCheckInterval = 5;
        this.gameTimer = null;
        
        // Sistema de animaciones Lottie
        this.lottieAnimations = {};
        
        // Sistema de sprites
        this.characterSprites = {};
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.spriteAnimationId = null;
        
        // Inicializar
        this.initElements();
        this.initLottieAnimations();
        this.initCharacterSprites();
        this.bindEvents();
        this.setupMobileOptimizations();
        this.updateDisplay();
        this.updateItemCounters(); // Inicializar contadores en UI
    }
    
    initElements() {
        // Elementos de UI básicos
        this.healthBar = document.getElementById('healthBar');
        this.intoxBar = document.getElementById('intoxBar');
        this.healthValue = document.getElementById('healthValue');
        this.intoxValue = document.getElementById('intoxValue');
        this.rumLevelEl = document.getElementById('rumLevel');
        this.progressText = document.getElementById('progressText');
        this.timer = document.getElementById('timer');
        this.gameContainer = document.getElementById('gameContainer');
        this.levelIndicator = document.getElementById('levelIndicator');
        
        // Overlays
        this.startOverlay = document.getElementById('startOverlay');
        this.endOverlay = document.getElementById('endOverlay');
        this.policeOverlay = document.getElementById('policeOverlay');
        this.endTitle = document.getElementById('endTitle');
        this.endMessage = document.getElementById('endMessage');
        
        // Personaje Canvas
        this.characterCanvas = document.getElementById('characterSprite');
        this.characterCtx = this.characterCanvas ? this.characterCanvas.getContext('2d') : null;
        
        // Elementos de cooldown
        this.foodCooldownEl = document.getElementById('foodCooldown');
        
        console.log('✅ Elementos DOM inicializados');
    }
    
    initLottieAnimations() {
        try {
            const animationConfigs = {
                drink: {
                    container: document.getElementById('drinkAnimation'),
                    path: 'https://assets10.lottiefiles.com/packages/lf20_t9gkkhz4.json',
                    autoplay: false,
                    loop: true
                },
                vomit: {
                    container: document.getElementById('vomitAnimation'),
                    path: 'https://assets2.lottiefiles.com/packages/lf20_DMgKk1.json',
                    autoplay: false,
                    loop: false
                },
                police: {
                    container: document.getElementById('policeAnimation'),
                    path: 'https://assets1.lottiefiles.com/packages/lf20_x62chJ.json',
                    autoplay: false,
                    loop: true
                },
                dance: {
                    container: document.getElementById('danceAnimation'),
                    path: 'https://assets9.lottiefiles.com/packages/lf20_khzniaya.json',
                    autoplay: false,
                    loop: true
                },
                victory: {
                    container: document.getElementById('victoryAnimation'),
                    path: 'https://assets4.lottiefiles.com/packages/lf20_touohxv0.json',
                    autoplay: false,
                    loop: false
                },
                defeat: {
                    container: document.getElementById('defeatAnimation'),
                    path: 'https://assets5.lottiefiles.com/packages/lf20_qp1spzqv.json',
                    autoplay: false,
                    loop: false
                },
                pills: {
                    container: document.getElementById('pillsAnimation'),
                    path: 'https://assets6.lottiefiles.com/packages/lf20_2cnqHl.json',
                    autoplay: false,
                    loop: false
                },
                smoke: {
                    container: document.getElementById('smokeAnimation'),
                    path: 'https://assets7.lottiefiles.com/packages/lf20_l1llusAQ.json',
                    autoplay: false,
                    loop: true
                }
            };
            
            Object.keys(animationConfigs).forEach(key => {
                try {
                    const config = animationConfigs[key];
                    if (config.container && window.lottie) {
                        this.lottieAnimations[key] = lottie.loadAnimation({
                            container: config.container,
                            renderer: 'svg',
                            loop: config.loop,
                            autoplay: config.autoplay,
                            path: config.path
                        });
                        
                        this.lottieAnimations[key].addEventListener('data_failed', () => {
                            console.log(`Animación ${key} falló al cargar, usando fallback`);
                            this.createFallbackAnimation(config.container, key);
                        });
                    }
                } catch (error) {
                    console.log(`Error cargando animación ${key}:`, error);
                }
            });
            
            console.log('✅ Animaciones Lottie inicializadas');
        } catch (error) {
            console.log('⚠️ Error inicializando Lottie:', error);
        }
    }
    
    createFallbackAnimation(container, type) {
        const emojis = {
            drink: '🍺', vomit: '🤮', police: '🚓', dance: '💃',
            victory: '🎉', defeat: '💀', pills: '💊', smoke: '💨'
        };
        
        container.innerHTML = `
            <div style="
                width: 100%; height: 100%; display: flex; align-items: center;
                justify-content: center; font-size: 4rem;
                animation: ${type}Fallback 1s ease-in-out infinite;
            ">
                ${emojis[type] || '✨'}
            </div>
        `;
    }
    
    initCharacterSprites() {
        console.log('🎨 Inicializando sprites del personaje...');
        
        try {
            // Crear sprites simulados (en producción, usar archivos PNG reales)
            const spriteConfigs = {
                idle: { frames: 4, frameRate: 500, generator: this.createIdleSprite.bind(this) },
                walk: { frames: 6, frameRate: 150, generator: this.createWalkSprite.bind(this) },
                drunk: { frames: 8, frameRate: 200, generator: this.createDrunkSprite.bind(this) },
                drink: { frames: 6, frameRate: 300, generator: this.createDrinkSprite.bind(this) },
                vomit: { frames: 5, frameRate: 400, generator: this.createVomitSprite.bind(this) }
            };
            
            Object.keys(spriteConfigs).forEach(animName => {
                const config = spriteConfigs[animName];
                const img = new Image();
                
                img.onload = () => {
                    this.characterSprites[animName] = {
                        image: img,
                        frames: config.frames,
                        frameRate: config.frameRate,
                        frameWidth: img.width / config.frames,
                        frameHeight: img.height
                    };
                    console.log(`✅ Sprite ${animName} cargado`);
                };
                
                img.onerror = () => {
                    console.error(`❌ Error cargando sprite ${animName}`);
                };
                
                img.src = config.generator();
            });
            
            this.startSpriteAnimation();
        } catch (error) {
            console.error('❌ Error inicializando sprites:', error);
        }
    }
    
    createIdleSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; // 4 frames
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 4; i++) {
            const x = i * 64;
            const breathOffset = Math.sin(i * Math.PI / 2) * 2;
            
            // Cuerpo (camisa azul)
            ctx.fillStyle = '#2E4BC6';
            ctx.fillRect(x + 20, 25 + breathOffset, 24, 30);
            
            // Cabeza
            ctx.fillStyle = '#FDBCB4';
            ctx.fillRect(x + 24, 10 + breathOffset, 16, 18);
            
            // Cabello
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 24, 8 + breathOffset, 16, 8);
            
            // Pantalones
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(x + 22, 48 + breathOffset, 20, 16);
            
            // Ojos
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 26, 16 + breathOffset, 2, 1);
            ctx.fillRect(x + 36, 16 + breathOffset, 2, 1);
            
            // Boca
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 30, 22 + breathOffset, 4, 1);
        }
        
        return canvas.toDataURL();
    }
    
    createWalkSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 384; // 6 frames
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 6; i++) {
            const x = i * 64;
            const walkCycle = Math.sin(i * Math.PI / 3);
            const legOffset = walkCycle * 3;
            
            // Cuerpo
            ctx.fillStyle = '#2E4BC6';
            ctx.fillRect(x + 20, 25, 24, 30);
            
            // Cabeza
            ctx.fillStyle = '#FDBCB4';
            ctx.fillRect(x + 24, 10, 16, 18);
            
            // Cabello
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 24, 8, 16, 8);
            
            // Piernas (con movimiento)
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(x + 22, 48 + legOffset, 8, 16);
            ctx.fillRect(x + 34, 48 - legOffset, 8, 16);
            
            // Ojos
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 26, 15, 2, 2);
            ctx.fillRect(x + 36, 15, 2, 2);
        }
        
        return canvas.toDataURL();
    }
    
    createDrunkSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; // 8 frames
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 8; i++) {
            const x = i * 64;
            const wobble = Math.sin(i * Math.PI / 4) * 4;
            
            // Cuerpo tambaleante
            ctx.fillStyle = '#2E4BC6';
            ctx.fillRect(x + 20 + wobble, 25, 24, 30);
            
            // Cabeza roja por alcohol
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(x + 24 + wobble, 10, 16, 18);
            
            // Cabello despeinado
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 24 + wobble, 8, 16, 8);
            
            // Pantalones
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(x + 22 + wobble, 48, 20, 16);
            
            // Ojos X por borrachera
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 26 + wobble, 15, 1, 1);
            ctx.fillRect(x + 28 + wobble, 17, 1, 1);
            ctx.fillRect(x + 36 + wobble, 15, 1, 1);
            ctx.fillRect(x + 38 + wobble, 17, 1, 1);
            
            // Boca abierta
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(x + 30 + wobble, 21, 4, 3);
        }
        
        return canvas.toDataURL();
    }
    
    createDrinkSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 384; // 6 frames
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 6; i++) {
            const x = i * 64;
            const drinkProgress = i / 5;
            
            // Cuerpo
            ctx.fillStyle = '#2E4BC6';
            ctx.fillRect(x + 20, 25, 24, 30);
            
            // Cabeza inclinada hacia atrás
            ctx.fillStyle = '#FDBCB4';
            ctx.fillRect(x + 24, 10 - drinkProgress * 2, 16, 18);
            
            // Cabello
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 24, 8 - drinkProgress * 2, 16, 8);
            
            // Pantalones
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(x + 22, 48, 20, 16);
            
            // Botella en mano
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 16, 25 - drinkProgress * 3, 3, 8);
            
            // Ojos cerrados o entreabiertos
            ctx.fillStyle = '#000';
            if (drinkProgress < 0.5) {
                ctx.fillRect(x + 26, 15, 2, 2);
                ctx.fillRect(x + 36, 15, 2, 2);
            } else {
                ctx.fillRect(x + 26, 16, 2, 1);
                ctx.fillRect(x + 36, 16, 2, 1);
            }
        }
        
        return canvas.toDataURL();
    }
    
    createVomitSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 320; // 5 frames
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 5; i++) {
            const x = i * 64;
            const vomitIntensity = Math.sin(i * Math.PI / 2) * 3;
            
            // Cuerpo doblado hacia adelante
            ctx.fillStyle = '#2E4BC6';
            ctx.fillRect(x + 20, 25 + vomitIntensity, 24, 30);
            
            // Cabeza verde por náuseas
            ctx.fillStyle = '#C0FFC0';
            ctx.fillRect(x + 24, 10 + vomitIntensity * 2, 16, 18);
            
            // Cabello
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 24, 8 + vomitIntensity * 2, 16, 8);
            
            // Pantalones
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(x + 22, 48, 20, 16);
            
            // Ojos cerrados con fuerza
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 26, 15 + vomitIntensity * 2, 2, 1);
            ctx.fillRect(x + 36, 15 + vomitIntensity * 2, 2, 1);
            
            // Boca abierta
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(x + 30, 22 + vomitIntensity * 2, 4, 4);
            
            // Efecto de vómito
            if (i > 1) {
                ctx.fillStyle = '#90EE90';
                const vomitX = x + 32 + vomitIntensity * 2;
                const vomitY = 35 + vomitIntensity * 3;
                ctx.fillRect(vomitX, vomitY, 2, 8);
                ctx.fillRect(vomitX + 3, vomitY + 2, 1, 6);
            }
        }
        
        return canvas.toDataURL();
    }
    
    startSpriteAnimation() {
        const animateSprite = () => {
            this.animationTimer += 16; // ~60fps
            
            const currentSprite = this.characterSprites[this.currentAnimation];
            if (currentSprite && this.animationTimer >= currentSprite.frameRate) {
                this.animationFrame = (this.animationFrame + 1) % currentSprite.frames;
                this.animationTimer = 0;
                this.drawCurrentFrame();
            }
            
            this.spriteAnimationId = requestAnimationFrame(animateSprite);
        };
        
        animateSprite();
    }
    
    drawCurrentFrame() {
        if (!this.characterCtx) return;
        
        const sprite = this.characterSprites[this.currentAnimation];
        if (!sprite) return;
        
        // Limpiar canvas
        this.characterCtx.clearRect(0, 0, this.characterCanvas.width, this.characterCanvas.height);
        
        // Configurar filtros según el estado
        this.characterCtx.filter = this.getSpriteFilter();
        
        // Dibujar frame actual
        const sourceX = this.animationFrame * sprite.frameWidth;
        const sourceY = 0;
        
        this.characterCtx.drawImage(
            sprite.image,
            sourceX, sourceY, sprite.frameWidth, sprite.frameHeight,
            0, 0, this.characterCanvas.width, this.characterCanvas.height
        );
        
        // Resetear filtros
        this.characterCtx.filter = 'none';
    }
    
    getSpriteFilter() {
        let filters = [];
        
        if (this.intoxication >= 80) {
            filters.push('hue-rotate(30deg)', 'saturate(1.3)');
        } else if (this.intoxication >= 50) {
            filters.push('hue-rotate(15deg)');
        }
        
        if (this.health <= 25) {
            filters.push('brightness(0.7)', 'contrast(1.2)');
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    }
    
    setCharacterAnimation(animationName, duration = null) {
        if (this.characterSprites[animationName]) {
            this.currentAnimation = animationName;
            this.animationFrame = 0;
            this.animationTimer = 0;
            
            if (duration) {
                setTimeout(() => {
                    this.setCharacterAnimation('idle');
                }, duration);
            }
        }
    }
    
    bindEvents() {
        // Eventos principales
        this.addButtonEvent('startBtn', () => this.startGame());
        this.addButtonEvent('restartBtn', () => this.restartGame());
        this.addButtonEvent('policeRestartBtn', () => this.restartGame());
        this.addButtonEvent('drinkBtn', () => this.drinkRum());
        this.addButtonEvent('hepaBtn', () => this.takeHepabionta());
        this.addButtonEvent('smokeBtn', () => this.smokeCigarette());
        this.addButtonEvent('cocaineBtn', () => this.snortCocaine());
        this.addButtonEvent('waterBtn', () => this.drinkWaterLemon());
        this.addButtonEvent('vomitBtn', () => this.vomit());
        this.addButtonEvent('foodBtn', () => this.eatFood());
        this.addButtonEvent('soundBtn', () => this.toggleSound());
        
        // Selector de nivel
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.currentLevel = parseInt(btn.dataset.level);
                this.updateLevelIndicator();
            });
        });
        
        // Eventos táctiles mejorados
        const buttons = document.querySelectorAll('.action-btn, .play-btn, .level-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                if (!btn.disabled) btn.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            btn.addEventListener('touchend', (e) => {
                btn.style.transform = '';
            }, { passive: true });
        });
        
        console.log('✅ Eventos vinculados');
    }
    
    addButtonEvent(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                callback();
            });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            });
        }
    }
    
    setupMobileOptimizations() {
        // Prevenir zoom en iOS
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
        
        // Vibración en móviles
        this.canVibrate = 'vibrate' in navigator;
        
        // Detectar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateDisplay(), 100);
        });
        
        // Prevenir scroll
        this.gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        console.log('✅ Optimizaciones móviles configuradas');
    }
    
    updateLevelIndicator() {
        const levelNames = {
            1: 'Nivel 1 - Principiante',
            2: 'Nivel 2 - Experimentado',
            3: 'Nivel 3 - Experto'
        };
        this.levelIndicator.textContent = levelNames[this.currentLevel];
        
        // Resetear contadores al cambiar nivel (en menú)
        if (!this.gameRunning) {
            this.waterLemonUsed = 0;
            this.foodEggUsed = 0;
            this.updateItemCounters();
        }
    }
    
    startGame() {
        this.initAudioContext();
        this.stopAllLottieAnimations();
        
        const settings = this.levelSettings[this.currentLevel];
        this.health = settings.startHealth;
        this.intoxication = 0;
        this.rumLevel = 100;
        this.timeLeft = settings.time;
        this.gameRunning = true;
        this.foodCooldown = 0;
        
        // Resetear contadores de uso por nivel
        this.waterLemonUsed = 0;
        this.foodEggUsed = 0;
        
        this.startOverlay.classList.add('hidden');
        this.endOverlay.classList.add('hidden');
        this.policeOverlay.classList.add('hidden');
        
        this.updateDisplay();
        this.updateLevelIndicator();
        this.updateItemCounters();
        this.startTimer();
        this.playSound('start');
        this.vibrate(100);
        
        this.setCharacterAnimation('idle');
        console.log('🎮 Juego iniciado');
    }
    
    restartGame() {
        this.startGame();
    }
    
    startTimer() {
        const settings = this.levelSettings[this.currentLevel];
        
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.foodCooldown > 0) {
                this.foodCooldown--;
                this.updateFoodCooldown();
            }
            
            // Regeneración pasiva de salud cada 8 segundos
            if (this.timeLeft % 8 === 0 && this.health < 100) {
                this.health = Math.min(100, this.health + settings.healthRegen);
            }
            
            // Intoxicación pasiva cada 12 segundos
            if (this.timeLeft % 12 === 0 && this.intoxication > 0) {
                this.intoxication = Math.min(100, this.intoxication + settings.intoxAccumulation);
            }
            
            // Verificar evento de policía cada 5 segundos
            if (this.timeLeft % this.policeCheckInterval === 0) {
                this.checkPoliceEvent();
            }
            
            // Daño por intoxicación alta
            if (this.timeLeft % 6 === 0) {
                if (this.intoxication >= 85) {
                    this.health = Math.max(0, this.health - 4);
                    this.vibrate(200);
                } else if (this.intoxication >= 70) {
                    this.health = Math.max(0, this.health - 2);
                    this.vibrate(100);
                }
                this.updateDisplay();
                this.checkGameState();
            }
            
            if (this.timeLeft % 8 === 0) {
                this.updateDisplay();
            }
            
            if (this.timeLeft <= 0) {
                this.endGame(false, '⏰ ¡Se acabó el tiempo!', 'No pudiste terminar la botella a tiempo.');
            }
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeLeft <= 30) {
            this.timer.style.color = '#ff4757';
            this.timer.style.animation = 'shake 1s infinite';
        }
    }
    
    checkPoliceEvent() {
        if (this.intoxication >= 90 && this.gameRunning) {
            if (Math.random() < 0.3) {
                this.policeArrest();
            }
        }
    }
    
    policeArrest() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        
        this.playLottieAnimation('police', 5000);
        
        document.getElementById('policeIntoxLevel').textContent = Math.round(this.intoxication) + '%';
        this.policeOverlay.classList.remove('hidden');
        
        this.playSound('police');
        this.vibrate([300, 200, 300, 200, 300]);
        
        console.log('🚓 ¡Arrestado por la policía!');
    }
    
    // Acciones del juego
    drinkRum() {
        if (!this.gameRunning) return;
        
        this.disableButtons(2000);
        this.setCharacterAnimation('drink', 2000);
        this.vibrate(150);
        
        this.playLottieAnimation('drink', 2000);
        
        setTimeout(() => {
            this.intoxication = Math.min(100, this.intoxication + 18);
            this.health = Math.max(0, this.health - 8);
            this.rumLevel = Math.max(0, this.rumLevel - 10);
            
            if (this.intoxication >= 70) {
                this.health = Math.max(0, this.health - 5);
                this.vibrate(300);
            }
            
            if (this.intoxication < 30 && this.health > 70) {
                this.playLottieAnimation('dance', 1500);
                this.addPartyMode();
            }
            
            this.updateDisplay();
            this.checkGameState();
            this.playSound('drink');
            this.addVisualEffect();
        }, 1000);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 2000);
    }
    
    takeHepabionta() {
        if (!this.gameRunning) return;
        
        this.disableButtons(1500);
        this.setCharacterAnimation('walk', 1500);
        this.vibrate(100);
        
        this.playLottieAnimation('pills', 1500);
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 12);
            this.health = Math.max(0, this.health - 20);
            
            this.updateDisplay();
            this.checkGameState();
            this.playSound('pill');
        }, 600);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 1500);
    }
    
    smokeCigarette() {
        if (!this.gameRunning) return;
        
        this.disableButtons(1800);
        this.setCharacterAnimation('idle', 1800);
        this.vibrate(80);
        
        this.playLottieAnimation('smoke', 1800);
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 3);
            this.health = Math.max(0, this.health - 8);
            
            this.updateDisplay();
            this.checkGameState();
            this.playSound('smoke');
        }, 700);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 1800);
    }
    
    snortCocaine() {
        if (!this.gameRunning) return;
        
        this.disableButtons(1200);
        this.setCharacterAnimation('drunk', 1200);
        this.vibrate([100, 50, 100, 50, 200]);
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 25);
            this.health = Math.max(0, this.health - 35);
            
            this.updateDisplay();
            this.checkGameState();
            this.playSound('cocaine');
            this.addIntenseEffect();
        }, 300);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 1200);
    }
    
    drinkWaterLemon() {
        if (!this.gameRunning) return;
        
        const settings = this.levelSettings[this.currentLevel];
        
        // Verificar si aún tiene usos disponibles
        if (this.waterLemonUsed >= settings.maxWaterLemon) {
            this.playSound('defeat');
            this.vibrate(200);
            console.log('❌ Ya no tienes más agua limón disponible');
            return;
        }
        
        this.disableButtons(1500);
        this.setCharacterAnimation('walk', 1500);
        this.vibrate(60);
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 8);
            
            // Solo aumentar salud si la intoxicación NO está en 0%
            if (this.intoxication > 0) {
                this.health = Math.min(100, this.health + 2);
            }
            
            // Incrementar contador de uso
            this.waterLemonUsed++;
            
            this.updateDisplay();
            this.updateItemCounters();
            this.checkGameState();
            this.playSound('water');
            
            console.log(`💧 Agua limón usada: ${this.waterLemonUsed}/${settings.maxWaterLemon}`);
        }, 700);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 1500);
    }
    
    vomit() {
        if (!this.gameRunning) return;
        
        this.disableButtons(2000);
        this.setCharacterAnimation('vomit', 2000);
        this.vibrate([200, 100, 200]);
        
        this.playLottieAnimation('vomit', 2000);
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 20);
            this.timeLeft = Math.max(0, this.timeLeft - 5);
            
            this.updateDisplay();
            this.checkGameState();
            this.playSound('vomit');
        }, 800);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 2000);
    }
    
    eatFood() {
        if (!this.gameRunning || this.foodCooldown > 0) return;
        
        const settings = this.levelSettings[this.currentLevel];
        
        // Verificar si aún tiene usos disponibles
        if (this.foodEggUsed >= settings.maxFoodEgg) {
            this.playSound('defeat');
            this.vibrate(200);
            console.log('❌ Ya no tienes más pan con huevo disponible');
            return;
        }
        
        this.disableButtons(1500);
        this.setCharacterAnimation('idle', 1500);
        this.vibrate(80);
        this.foodCooldown = this.foodCooldownMax;
        
        setTimeout(() => {
            this.intoxication = Math.max(0, this.intoxication - 10);
            
            // Solo aumentar salud si la intoxicación NO está en 0%
            if (this.intoxication > 0) {
                this.health = Math.min(100, this.health + 5);
            }
            
            // Incrementar contador de uso
            this.foodEggUsed++;
            
            this.updateDisplay();
            this.updateFoodCooldown();
            this.updateItemCounters();
            this.checkGameState();
            this.playSound('eat');
            
            console.log(`🍳 Pan con huevo usado: ${this.foodEggUsed}/${settings.maxFoodEgg}`);
        }, 700);
        
        setTimeout(() => {
            this.updateCharacterAnimation();
        }, 1500);
    }
    
    updateFoodCooldown() {
        const settings = this.levelSettings[this.currentLevel];
        const foodRemaining = settings.maxFoodEgg - this.foodEggUsed;
        
        if (this.foodCooldown > 0) {
            this.foodCooldownEl.classList.remove('hidden');
            this.foodCooldownEl.textContent = this.foodCooldown + 's';
            document.getElementById('foodBtn').disabled = true;
        } else {
            this.foodCooldownEl.classList.add('hidden');
            
            // Solo habilitar si quedan usos disponibles
            if (foodRemaining > 0) {
                document.getElementById('foodBtn').disabled = false;
            }
        }
        
        // Actualizar contador visual siempre
        this.updateItemCounters();
    }
    
    updateItemCounters() {
        const settings = this.levelSettings[this.currentLevel];
        
        // Actualizar contadores en los botones
        const waterBtn = document.getElementById('waterBtn');
        const foodBtn = document.getElementById('foodBtn');
        
        if (waterBtn) {
            const waterRemaining = settings.maxWaterLemon - this.waterLemonUsed;
            const waterSmall = waterBtn.querySelector('small');
            if (waterSmall) {
                waterSmall.innerHTML = `
                    -8% intox, +2% salud<br>
                    <span style="color: ${waterRemaining <= 2 ? '#ff6b6b' : '#FFD700'};">
                        Quedan: ${waterRemaining}
                    </span>
                `;
            }
            
            // Deshabilitar si se agotaron los usos
            if (waterRemaining <= 0) {
                waterBtn.disabled = true;
                waterBtn.style.opacity = '0.3';
                waterBtn.style.cursor = 'not-allowed';
            } else {
                waterBtn.disabled = false;
                waterBtn.style.opacity = '1';
                waterBtn.style.cursor = 'pointer';
            }
        }
        
        if (foodBtn) {
            const foodRemaining = settings.maxFoodEgg - this.foodEggUsed;
            const foodSmall = foodBtn.querySelector('small');
            if (foodSmall) {
                foodSmall.innerHTML = `
                    -10% intox, +5% salud<br>
                    <span style="color: ${foodRemaining <= 0 ? '#ff6b6b' : '#FFD700'};">
                        Quedan: ${foodRemaining}
                    </span>
                `;
            }
            
            // Deshabilitar si se agotaron los usos (pero respetar cooldown)
            if (foodRemaining <= 0) {
                foodBtn.disabled = true;
                foodBtn.style.opacity = '0.3';
                foodBtn.style.cursor = 'not-allowed';
            } else if (this.foodCooldown === 0) {
                foodBtn.disabled = false;
                foodBtn.style.opacity = '1';
                foodBtn.style.cursor = 'pointer';
            }
        }
    }
    
    disableButtons(duration) {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            if (btn.id !== 'foodBtn' || this.foodCooldown === 0) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
        });
        
        setTimeout(() => {
            buttons.forEach(btn => {
                // Casos especiales para botones con restricciones
                if (btn.id === 'waterBtn') {
                    const settings = this.levelSettings[this.currentLevel];
                    const waterRemaining = settings.maxWaterLemon - this.waterLemonUsed;
                    if (waterRemaining > 0) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }
                } else if (btn.id === 'foodBtn') {
                    const settings = this.levelSettings[this.currentLevel];
                    const foodRemaining = settings.maxFoodEgg - this.foodEggUsed;
                    if (foodRemaining > 0 && this.foodCooldown === 0) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }
                } else {
                    // Botones normales
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            });
            
            // Actualizar contadores después de reactivar botones
            this.updateItemCounters();
        }, duration);
    }
    
    updateDisplay() {
        this.healthBar.style.width = `${this.health}%`;
        this.intoxBar.style.width = `${this.intoxication}%`;
        this.healthValue.textContent = `${Math.round(this.health)}%`;
        this.intoxValue.textContent = `${Math.round(this.intoxication)}%`;
        
        this.rumLevelEl.style.height = `${this.rumLevel}%`;
        this.progressText.textContent = `🍾 ${Math.round(this.rumLevel)}%`;
        
        this.updateCharacterAnimation();
        
        // Efectos visuales por intoxicación
        this.gameContainer.classList.remove('shake', 'blur');
        if (this.intoxication >= 70) {
            this.gameContainer.classList.add('shake', 'blur');
        } else if (this.intoxication >= 50) {
            this.gameContainer.classList.add('shake');
        }
        
        // Color de barra de salud
        if (this.health <= 25) {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff4757, #ff3742)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #ff4757, #ff6b6b)';
        }
        
        // Efectos en el canvas según estado
        if (this.intoxication >= 70 && this.characterCanvas) {
            this.characterCanvas.style.transform = `rotate(${Math.random() * 4 - 2}deg)`;
        } else if (this.characterCanvas) {
            this.characterCanvas.style.transform = 'rotate(0deg)';
        }
    }
    
    updateCharacterAnimation() {
        if (['drink', 'vomit'].includes(this.currentAnimation)) {
            return;
        }
        
        let newAnimation = 'idle';
        
        if (this.health <= 0) {
            newAnimation = 'idle';
        } else if (this.intoxication >= 80) {
            newAnimation = 'drunk';
        } else if (this.intoxication >= 50) {
            newAnimation = 'drunk';
        } else if (this.health <= 30) {
            newAnimation = 'walk';
        } else {
            newAnimation = 'idle';
        }
        
        this.setCharacterAnimation(newAnimation);
    }
    
    checkGameState() {
        if (this.health <= 0) {
            this.endGame(false, '💀 ¡HAS MUERTO!', 'Tu salud llegó a cero. Fuiste demasiado extremo.');
        } else if (this.rumLevel <= 0) {
            this.endGame(true, '🎉 ¡VICTORIA!', `¡Lograste completar el Nivel ${this.currentLevel}!`);
        }
    }
    
    endGame(victory, title, message) {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        
        this.stopAllLottieAnimations();
        
        this.endTitle.textContent = title;
        this.endMessage.textContent = message;
        this.endOverlay.classList.remove('hidden');
        
        if (victory) {
            this.endTitle.style.color = '#32CD32';
            this.playSound('victory');
            this.vibrate([200, 100, 200, 100, 400]);
            
            this.playLottieAnimation('victory', 4000);
            this.addPartyMode();
            
            if (this.currentLevel < 3) {
                this.endMessage.textContent += `\n\n¡Nivel ${this.currentLevel + 1} desbloqueado!`;
            }
        } else {
            this.endTitle.style.color = '#ff4757';
            this.playSound('defeat');
            this.vibrate([500, 200, 500]);
            
            this.playLottieAnimation('defeat', 3000);
        }
    }
    
    // Métodos de Lottie
    playLottieAnimation(animationName, duration = 2000) {
        try {
            const animation = this.lottieAnimations[animationName];
            const container = document.getElementById(animationName + 'Animation');
            
            if (animation && container) {
                container.classList.add('active');
                animation.goToAndPlay(0);
                
                setTimeout(() => {
                    this.stopLottieAnimation(animationName);
                }, duration);
            }
        } catch (error) {
            console.log(`Error reproduciendo animación ${animationName}:`, error);
        }
    }
    
    stopLottieAnimation(animationName) {
        try {
            const animation = this.lottieAnimations[animationName];
            const container = document.getElementById(animationName + 'Animation');
            
            if (animation && container) {
                animation.pause();
                container.classList.remove('active');
            }
        } catch (error) {
            console.log(`Error parando animación ${animationName}:`, error);
        }
    }
    
    stopAllLottieAnimations() {
        Object.keys(this.lottieAnimations).forEach(name => {
            this.stopLottieAnimation(name);
        });
    }
    
    addPartyMode() {
        this.gameContainer.classList.add('party-mode');
        setTimeout(() => {
            this.gameContainer.classList.remove('party-mode');
        }, 3000);
    }
    
    addVisualEffect() {
        this.gameContainer.style.filter = 'brightness(1.2)';
        setTimeout(() => {
            this.gameContainer.style.filter = '';
        }, 200);
    }
    
    addIntenseEffect() {
        this.gameContainer.style.filter = 'brightness(1.5) contrast(1.2)';
        setTimeout(() => {
            this.gameContainer.style.filter = '';
        }, 500);
    }
    
    vibrate(pattern) {
        if (this.canVibrate && this.soundEnabled) {
            navigator.vibrate(pattern);
        }
    }
    
    // Sistema de audio
    initAudioContext() {
        if (!this.audioContext && this.soundEnabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ AudioContext inicializado');
            } catch (e) {
                console.log('⚠️ AudioContext no disponible:', e);
                this.audioContext = null;
            }
        }
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        if (!this.audioContext) return;
        
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.createSound(type);
                }).catch(e => {
                    console.log('Error resumiendo AudioContext:', e);
                });
            } else {
                this.createSound(type);
            }
        } catch (e) {
            console.log('Error en playSound:', e);
        }
    }
    
    createSound(type) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            let frequency = 440;
            let duration = 0.2;
            
            const frequencies = {
                drink: [200, 0.3], pill: [800, 0.1], smoke: [150, 0.4],
                cocaine: [1000, 0.1], water: [600, 0.2], vomit: [100, 0.5],
                eat: [400, 0.3], police: [880, 0.8], victory: [523, 1],
                defeat: [100, 0.8], start: [330, 0.5]
            };
            
            if (frequencies[type]) {
                [frequency, duration] = frequencies[type];
            }
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error creando sonido:', e);
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊' : '🔇';
    }
}

// Inicializar el juego
let game = null;

function initGame() {
    try {
        game = new ElUltimoRonGame();
        window.game = game; // Para debug
        console.log('🎮 El Último Ron iniciado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando el juego:', error);
        document.body.innerHTML += `
            <div style="
                position: fixed; top: 20px; left: 20px; right: 20px;
                background: red; color: white; padding: 20px; 
                border-radius: 10px; z-index: 9999; text-align: center;
            ">
                <h3>Error del Juego</h3>
                <p>Error: ${error.message}</p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px; background: white; color: red;
                    border: none; border-radius: 5px; cursor: pointer;
                ">Recargar Página</button>
            </div>
        `;
    }
}

// Múltiples puntos de entrada para máxima compatibilidad
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

window.addEventListener('load', () => {
    if (!game) {
        setTimeout(initGame, 100);
    }
});

console.log('📜 Script cargado correctamente');
