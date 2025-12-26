class MusicGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.circles = [];
        // 初始化尺寸（会在updateScale中更新）
        this.targetX = 0;
        this.targetY = 0;
        this.targetRadius = 60;
        this.circleRadius = 51;
        this.speed = 3;
        this.baseSpeed = 3; // 基础速度
        this.speedMultiplier = 1.0; // 速度倍数
        this.travelTimeMultiplier = 2.0; // 移动时间倍数（越大，音符越密集，流动越慢）
        this.hitWindow = 50; // 命中窗口（会在updateScale中更新）
        this.hitWindowGreatBase = 20; // Great判定窗口基础值（未缩放）
        this.hitWindowGoodBase = 40; // Good判定窗口基础值（未缩放）
        this.hitWindowBadBase = 55; // Bad判定窗口基础值（未缩放）
        this.hitWindowGreat = 20; // Great判定窗口（会在updateScale中更新）
        this.hitWindowGood = 40; // Good判定窗口（会在updateScale中更新）
        this.hitWindowBad = 55; // Bad判定窗口（会在updateScale中更新）
        this.hitOffsetBase = -4; // 判定偏移基础值（未缩放）
        this.hitOffset = 0; // 判定偏移（会在updateScale中更新）
        this.musicVolume = 70; // 音乐音量（0-100）
        this.effectVolume = 80; // 效果音量（0-100）
        this.noteTimeline = [];
        this.gameStartTime = null;
        this.timeoutIds = []; // 存储所有定时器ID，用于清除
        this.bgMusic = null; // 背景音乐
        this.dongSound = null; // Don音效
        this.kaSound = null; // Ka音效
        this.noteDelay = 3.48; // 音符延迟时间（秒），音符比音乐晚开始的时间
        
        // 谱面数据（直接嵌入）
        this.chartData = `#BPMCHANGE 140.39
0,
0,
0,
#BPMCHANGE 140.98
1,
#BPMCHANGE 140.27
11,
#BPMCHANGE 142.32
1,
#BPMCHANGE 141.01
1,
11,
1011,
11,
1,
1,
#BPMCHANGE 142.84
1,
#BPMCHANGE 141
1110111011102220,
1110111011102220,
1110111011102220,
1110111010000000,
1001101011102020,
1001101011102020,
1001101011102020,
1001101011102020,
1001102011102022,
1001102011101110,
1001102011102022,
1001102011101110,
1001101011102020,
1001101011102020,
1001101011102020,
1001101011102020,
1001102011102022,
1001102011102022,
1001102011102020,
5000008011101011,
10101011,
1000100010201110,
1011102010221020,
0,
10101011,
1000100010201110,
1,
1,
1110111011102220,
1110111011102220,
1110111010001010,
12111011,
1001101022201110,
12111011,
1001101022201110,
1022102210221020,
00000011,
1022102210221020,
00000011,
12111011,
1001101022201110,
12111011,
1001101022201110,
1022102210221020,
00000011,
1022102210221020,
0000000011101011,
1000100010111020,
1020101110111020,
1020101110111020,
0,
1000102010111020,
1020101110111020,
10221022,
1,
1110111011111020,
1110111011111020,
1110111011111020,
1,


#END`;
        
        this.init();
    }
    
    init() {
        // 预加载所有资源
        this.preloadResources();
    }
    
    preloadResources() {
        // 定义所有需要预加载的资源
        const resources = [
            // 图片资源
            'Resources/BG.jpg',
            'Resources/Title.jpg',
            'Resources/StartButton.png',
            'Resources/Restart.png',
            'Resources/Frame.png',
            'Resources/Red.png',
            'Resources/Blue.png',
            'Resources/Great_icon.png',
            'Resources/Great.png',
            'Resources/Good.png',
            'Resources/Bad.png',
            'Resources/BG_Mask.png',
            'Resources/donggif.gif',
            // 音频资源
            'song.ogg',
            'Resources/dong.ogg',
            'Resources/ka.ogg'
        ];
        
        let loadedCount = 0;
        const totalResources = resources.length;
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('loadingProgressBar');
        const loadingPercentage = document.getElementById('loadingPercentage');
        
        // 更新进度
        const updateProgress = () => {
            const percentage = Math.round((loadedCount / totalResources) * 100);
            if (progressBar) {
                progressBar.style.width = percentage + '%';
            }
            if (loadingPercentage) {
                loadingPercentage.textContent = percentage + '%';
            }
        };
        
        // 加载单个资源
        const loadResource = (url) => {
            return new Promise((resolve, reject) => {
                if (url.endsWith('.ogg')) {
                    // 音频资源
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.oncanplaythrough = () => {
                        loadedCount++;
                        updateProgress();
                        resolve();
                    };
                    audio.onerror = () => {
                        loadedCount++;
                        updateProgress();
                        resolve(); // 即使失败也继续
                    };
                    audio.src = url;
                } else {
                    // 图片资源
                    const img = new Image();
                    img.onload = () => {
                        loadedCount++;
                        updateProgress();
                        resolve();
                    };
                    img.onerror = () => {
                        loadedCount++;
                        updateProgress();
                        resolve(); // 即使失败也继续
                    };
                    img.src = url;
                }
            });
        };
        
        // 加载所有资源
        Promise.all(resources.map(loadResource)).then(() => {
            // 所有资源加载完成，初始化游戏
            this.initializeGame();
            // 隐藏加载页面
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        });
    }
    
    initializeGame() {
        // 初始化背景音乐
        this.bgMusic = document.getElementById('bgMusic');
        if (this.bgMusic) {
            this.bgMusic.volume = this.musicVolume / 100; // 设置音量
            this.bgMusic.loop = false; // 不循环播放
        }
        
        // 初始化音效
        this.dongSound = new Audio('Resources/dong.ogg');
        this.dongSound.volume = this.effectVolume / 100;
        this.kaSound = new Audio('Resources/ka.ogg');
        this.kaSound.volume = this.effectVolume / 100;
        
        // 计算并设置缩放比例
        this.updateScale();
        
        this.parseChart();
        this.updateScore();
        this.setupEventListeners();
        // 不自动开始游戏，等待用户点击开始按钮
        this.animate();
    }
    
    updateScale() {
        const container = document.querySelector('.game-container');
        if (!container) return;
        
        // 等待一帧确保容器尺寸已计算
        requestAnimationFrame(() => {
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            
            // 基于1920x1080基准计算缩放比例
            // 使用最小边确保等比例缩放
            const scaleX = containerWidth / 1920;
            const scaleY = containerHeight / 1080;
            const scale = Math.min(scaleX, scaleY);
            
            // 设置CSS变量
            container.style.setProperty('--scale', scale);
            
            // 更新JavaScript中的尺寸
            this.hitOffset = this.hitOffsetBase * scale; // 判定偏移（缩放后）
            this.targetX = containerWidth * 0.19 + (200 - 40) * scale + this.hitOffset; // 判定逻辑位置（包含偏移）
            this.targetY = containerHeight * 0.38; // 音符和判定框的Y位置在38%处
            this.targetRadius = 60 * scale;
            this.circleRadius = 51 * scale;
            this.hitWindow = 50 * scale;
            this.hitWindowGreat = this.hitWindowGreatBase * scale;
            this.hitWindowGood = this.hitWindowGoodBase * scale;
            this.hitWindowBad = this.hitWindowBadBase * scale;
        });
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.code;
            // 红音符：F 或 J 键
            if (key === 'KeyF' || key === 'KeyJ') {
                e.preventDefault();
                this.playSound('dong');
                this.showKeyOverlay('Don.png');
                this.checkHit('red');
            }
            // 蓝音符：D 或 K 键
            else if (key === 'KeyD' || key === 'KeyK') {
                e.preventDefault();
                this.playSound('ka');
                this.showKeyOverlay('Ka.png');
                this.checkHit('blue');
            }
        });
        
        // 窗口大小改变时更新目标位置
        window.addEventListener('resize', () => {
            this.updateScale();
        });
        
        // 速度控制滑块
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.speedMultiplier = parseFloat(e.target.value);
                this.speed = this.baseSpeed * this.speedMultiplier;
                speedValue.textContent = this.speedMultiplier.toFixed(1) + 'x';
            });
        }
        
        // 开始按钮
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.hideStartScreen();
                this.startGame();
            });
        }
        
        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
        
        // 调试面板
        this.setupDebugPanel();
    }
    
    playSound(soundType) {
        let sound = null;
        if (soundType === 'dong') {
            sound = this.dongSound;
        } else if (soundType === 'ka') {
            sound = this.kaSound;
        }
        
        if (sound) {
            // 重置音频到开始位置，以便可以快速重复播放
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn('音效播放失败:', error);
            });
        }
    }
    
    showKeyOverlay(imageName) {
        const overlay = document.getElementById('keyOverlay');
        if (!overlay) return;
        
        // 设置背景图片
        overlay.style.backgroundImage = `url('Resources/${imageName}')`;
        
        // 移除之前的动画类
        overlay.classList.remove('show');
        
        // 强制重排以重置动画
        void overlay.offsetWidth;
        
        // 添加动画类
        overlay.classList.add('show');
        
        // 动画结束后移除类
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 200);
    }
    
    setupDebugPanel() {
        const toggleBtn = document.getElementById('toggleDebug');
        const debugContent = document.getElementById('debugContent');
        const delaySlider = document.getElementById('delaySlider');
        const delayValue = document.getElementById('delayValue');
        const applyDelayBtn = document.getElementById('applyDelayBtn');
        const greatSlider = document.getElementById('greatSlider');
        const greatValue = document.getElementById('greatValue');
        const goodSlider = document.getElementById('goodSlider');
        const goodValue = document.getElementById('goodValue');
        const badSlider = document.getElementById('badSlider');
        const badValue = document.getElementById('badValue');
        const applyAccuracyBtn = document.getElementById('applyAccuracyBtn');
        
        // 折叠/展开功能
        if (toggleBtn && debugContent) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = debugContent.classList.contains('hidden');
                if (isHidden) {
                    debugContent.classList.remove('hidden');
                    toggleBtn.textContent = '−';
                } else {
                    debugContent.classList.add('hidden');
                    toggleBtn.textContent = '+';
                }
            });
        }
        
        // 延迟滑块
        if (delaySlider && delayValue) {
            // 初始化显示当前延迟值
            delaySlider.value = this.noteDelay;
            delayValue.textContent = this.noteDelay.toFixed(3);
            
            delaySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                delayValue.textContent = value.toFixed(3);
            });
        }
        
        // 应用延迟按钮
        if (applyDelayBtn && delaySlider) {
            applyDelayBtn.addEventListener('click', () => {
                const newDelay = parseFloat(delaySlider.value);
                this.noteDelay = newDelay;
                console.log(`延迟已更新为: ${newDelay.toFixed(3)}秒`);
                
                // 重新开始游戏以应用新的延迟
                this.restart();
            });
        }
        
        // Great判定滑块
        if (greatSlider && greatValue) {
            greatSlider.value = this.hitWindowGreatBase;
            greatValue.textContent = this.hitWindowGreatBase;
            
            greatSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                greatValue.textContent = value;
            });
        }
        
        // Good判定滑块
        if (goodSlider && goodValue) {
            goodSlider.value = this.hitWindowGoodBase;
            goodValue.textContent = this.hitWindowGoodBase;
            
            goodSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                goodValue.textContent = value;
            });
        }
        
        // Bad判定滑块
        if (badSlider && badValue) {
            badSlider.value = this.hitWindowBadBase;
            badValue.textContent = this.hitWindowBadBase;
            
            badSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                badValue.textContent = value;
            });
        }
        
        // 应用判定按钮
        if (applyAccuracyBtn && greatSlider && goodSlider && badSlider) {
            applyAccuracyBtn.addEventListener('click', () => {
                const newGreat = parseInt(greatSlider.value);
                const newGood = parseInt(goodSlider.value);
                const newBad = parseInt(badSlider.value);
                
                this.hitWindowGreatBase = newGreat;
                this.hitWindowGoodBase = newGood;
                this.hitWindowBadBase = newBad;
                
                // 更新缩放后的值
                const container = document.querySelector('.game-container');
                if (container) {
                    const containerWidth = container.offsetWidth;
                    const containerHeight = container.offsetHeight;
                    const scaleX = containerWidth / 1920;
                    const scaleY = containerHeight / 1080;
                    const scale = Math.min(scaleX, scaleY);
                    
                    this.hitWindowGreat = this.hitWindowGreatBase * scale;
                    this.hitWindowGood = this.hitWindowGoodBase * scale;
                    this.hitWindowBad = this.hitWindowBadBase * scale;
                }
                
                console.log(`判定值已更新 - Great: ${newGreat}px, Good: ${newGood}px, Bad: ${newBad}px`);
            });
        }
        
        // 判定偏移滑块
        const hitOffsetSlider = document.getElementById('hitOffsetSlider');
        const hitOffsetValue = document.getElementById('hitOffsetValue');
        const applyOffsetBtn = document.getElementById('applyOffsetBtn');
        
        if (hitOffsetSlider && hitOffsetValue) {
            hitOffsetSlider.value = this.hitOffsetBase;
            hitOffsetValue.textContent = this.hitOffsetBase;
            
            hitOffsetSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                hitOffsetValue.textContent = value;
            });
        }
        
        // 应用判定偏移按钮
        if (applyOffsetBtn && hitOffsetSlider) {
            applyOffsetBtn.addEventListener('click', () => {
                const newOffset = parseInt(hitOffsetSlider.value);
                this.hitOffsetBase = newOffset;
                
                // 更新缩放后的值并重新计算targetX
                this.updateScale();
                
                console.log(`判定偏移已更新为: ${newOffset}px`);
            });
        }
        
        // 音乐音量滑块
        const musicVolumeSlider = document.getElementById('musicVolumeSlider');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.value = this.musicVolume;
            musicVolumeValue.textContent = this.musicVolume;
            
            musicVolumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                musicVolumeValue.textContent = value;
                this.musicVolume = value;
                
                // 实时更新音乐音量
                if (this.bgMusic) {
                    this.bgMusic.volume = value / 100;
                }
            });
        }
        
        // 效果音量滑块
        const effectVolumeSlider = document.getElementById('effectVolumeSlider');
        const effectVolumeValue = document.getElementById('effectVolumeValue');
        
        if (effectVolumeSlider && effectVolumeValue) {
            effectVolumeSlider.value = this.effectVolume;
            effectVolumeValue.textContent = this.effectVolume;
            
            effectVolumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                effectVolumeValue.textContent = value;
                this.effectVolume = value;
                
                // 实时更新效果音量
                if (this.dongSound) {
                    this.dongSound.volume = value / 100;
                }
                if (this.kaSound) {
                    this.kaSound.volume = value / 100;
                }
            });
        }
    }
    
    restart() {
        console.log('重新开始游戏...');
        
        // 停止并重置背景音乐
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
        
        // 清除所有定时器
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];
        
        // 清除所有音符
        this.circles.forEach(circle => {
            if (circle.element && circle.element.parentNode) {
                circle.element.remove();
            }
        });
        this.circles = [];
        
        // 重置分数和连击
        this.score = 0;
        this.combo = 0;
        this.updateScore();
        this.updateCombo();
        
        // 重新解析谱面并开始游戏
        this.parseChart();
        // startGame()中已经处理了音频播放，不需要再次播放
        this.startGame();
    }
    
    parseChart() {
        const lines = this.chartData.split('\n').map(line => line.trim());
        let currentBPM = 140; // 默认BPM
        let currentTime = 0; // 当前时间（秒）
        const notes = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // 跳过空行和结束标记
            if (line === '' || line === '#END') {
                continue;
            }
            
            // 处理BPM变化
            if (line.startsWith('#BPMCHANGE')) {
                const bpmMatch = line.match(/#BPMCHANGE\s+([\d.]+)/);
                if (bpmMatch) {
                    currentBPM = parseFloat(bpmMatch[1]);
                }
                continue;
            }
            
            // 跳过其他命令
            if (line.startsWith('#')) {
                continue;
            }
            
            // 处理小节数据
            // 移除末尾的逗号（如果有）
            line = line.replace(/,$/, '');
            
            if (line.length === 0) {
                continue;
            }
            
            // 计算这个小节的时长（4拍）
            const measureDuration = (60 / currentBPM) * 4; // 秒
            
            // 计算每个字符（音符或空拍）占用的时间
            const noteDuration = measureDuration / line.length;
            
            // 遍历该小节中的每个字符
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '1') {
                    // 红色音符
                    notes.push({
                        time: currentTime,
                        type: 'red',
                        bpm: currentBPM
                    });
                } else if (char === '2') {
                    // 蓝色音符
                    notes.push({
                        time: currentTime,
                        type: 'blue',
                        bpm: currentBPM
                    });
                }
                // 0 和其他字符代表空拍，不生成音符，但时间要推进
                
                // 推进时间
                currentTime += noteDuration;
            }
        }
        
        // 按时间排序
        this.noteTimeline = notes.sort((a, b) => a.time - b.time);
        console.log(`解析完成，共 ${this.noteTimeline.length} 个音符`);
    }
    
    startGame() {
        if (this.noteTimeline.length === 0) {
            console.error('没有解析到任何音符！请检查谱面数据。');
            return;
        }
        
        // 计算音符从右侧到目标位置所需的时间
        // 使用平均BPM来计算速度
        const uniqueBPMs = [...new Set(this.noteTimeline.map(note => note.bpm))];
        const avgBPM = uniqueBPMs.length > 0 
            ? uniqueBPMs.reduce((sum, bpm) => sum + bpm, 0) / uniqueBPMs.length 
            : 140;
        
        // 计算移动速度：假设一个4拍的时间，音符从右侧移动到目标位置
        const measureDuration = (60 / avgBPM) * 4; // 秒
        const container = document.querySelector('.game-container');
        const containerWidth = container ? container.offsetWidth : window.innerWidth;
        const distance = containerWidth - this.targetX; // 像素
        
        // 增加移动时间，使音符更密集、流动更慢，但节奏不变
        const travelTime = measureDuration * this.travelTimeMultiplier; // 秒
        
        // 根据新的移动时间计算速度
        const pixelsPerSecond = distance / travelTime;
        const fps = 60; // 假设60fps
        this.baseSpeed = pixelsPerSecond / fps; // 像素/帧（基础速度）
        this.speed = this.baseSpeed * this.speedMultiplier; // 应用速度倍数
        
        // 找到第一个音符的时间
        const firstNoteTime = this.noteTimeline[0].time;
        
        // 如果第一个音符的时间小于travelTime，我们需要提前开始
        // 调整时间基准，让第一个音符在正确的时间到达
        const timeOffset = Math.max(0, travelTime - firstNoteTime);
        
        console.log(`游戏开始 - 平均BPM: ${avgBPM.toFixed(2)}, 移动速度: ${this.speed.toFixed(2)} 像素/帧, 移动时间: ${travelTime.toFixed(2)}秒 (倍数: ${this.travelTimeMultiplier}x)`);
        console.log(`第一个音符时间: ${firstNoteTime.toFixed(2)}秒, 类型: ${this.noteTimeline[0].type}, 时间偏移: ${timeOffset.toFixed(2)}秒`);
        
        // 同步播放背景音乐并安排音符生成
        if (this.bgMusic) {
            // 重置音频到开始位置
            this.bgMusic.currentTime = 0;
            
            // 尝试播放音频
            const playPromise = this.bgMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 音频真正开始播放后，设置游戏开始时间
                    // 使用音频的实际播放时间作为基准
                    const audioStartTime = Date.now();
                    this.gameStartTime = audioStartTime - (timeOffset * 1000);
                    
                    console.log('背景音乐开始播放，与游戏同步');
                    
                    // 在音频开始播放后再安排音符生成
                    this.scheduleNotes(travelTime, timeOffset, firstNoteTime);
                }).catch(error => {
                    console.warn('音频自动播放被阻止，将在用户交互时播放:', error);
                    // 即使音频播放失败，也使用当前时间作为基准
                    this.gameStartTime = Date.now() - (timeOffset * 1000);
                    this.scheduleNotes(travelTime, timeOffset, firstNoteTime);
                });
            } else {
                // 如果没有返回Promise，直接设置时间并安排音符
                this.gameStartTime = Date.now() - (timeOffset * 1000);
                this.scheduleNotes(travelTime, timeOffset, firstNoteTime);
            }
        } else {
            // 如果没有音频，直接设置时间并安排音符
            this.gameStartTime = Date.now() - (timeOffset * 1000);
            this.scheduleNotes(travelTime, timeOffset, firstNoteTime);
        }
    }
    
    scheduleNotes(travelTime, timeOffset, firstNoteTime) {
        // 为每个音符安排生成时间
        this.noteTimeline.forEach((note, index) => {
            // 音符应该在 (note.time - travelTime + timeOffset + noteDelay) 时生成
            // noteDelay 使音符比音乐晚开始
            const spawnTime = (note.time - travelTime + timeOffset + this.noteDelay) * 1000; // 转换为毫秒
            
            if (index < 5) {
                console.log(`音符 ${index}: 时间=${note.time.toFixed(2)}s, 类型=${note.type}, 生成时间=${spawnTime.toFixed(0)}ms (延迟${this.noteDelay}秒)`);
            }
            
            // 确保生成时间不为负数
            const actualSpawnTime = Math.max(0, spawnTime);
            
            const timeoutId = setTimeout(() => {
                this.spawnCircle(note.type);
            }, actualSpawnTime);
            
            // 保存定时器ID以便清除
            this.timeoutIds.push(timeoutId);
        });
    }
    
    spawnCircle(type) {
        const container = document.getElementById('circlesContainer');
        if (!container) {
            console.error('找不到 circlesContainer 元素！');
            return;
        }
        
        const gameContainer = document.querySelector('.game-container');
        const containerWidth = gameContainer ? gameContainer.offsetWidth : window.innerWidth;
        const containerHeight = gameContainer ? gameContainer.offsetHeight : window.innerHeight;
        
        const circle = document.createElement('div');
        circle.className = `moving-circle ${type}`;
        circle.style.left = containerWidth + 'px';
        circle.style.top = (containerHeight * 0.38) + 'px';
        circle.dataset.id = Date.now() + Math.random();
        circle.dataset.type = type;
        
        container.appendChild(circle);
        
        this.circles.push({
            element: circle,
            x: containerWidth,
            y: containerHeight / 2 - 130,
            id: circle.dataset.id,
            type: type,
            hit: false
        });
        
        console.log(`生成音符: ${type}, 当前音符数: ${this.circles.length}`);
    }
    
    animate() {
        this.updateCircles();
        this.removeOffscreenCircles();
        requestAnimationFrame(() => this.animate());
    }
    
    updateCircles() {
        // 实时更新速度（应用速度倍数）
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        this.circles.forEach(circle => {
            if (!circle.hit) {
                circle.x -= this.speed;
                circle.element.style.left = circle.x + 'px';
            }
        });
    }
    
    removeOffscreenCircles() {
        this.circles = this.circles.filter(circle => {
            // 如果圆已经移出屏幕左侧，移除它
            if (circle.x + this.circleRadius < 0) {
                if (!circle.hit) {
                    // 如果圆没有被命中就移出屏幕，重置连击
                    this.combo = 0;
                    this.updateCombo();
                }
                circle.element.remove();
                return false;
            }
            return true;
        });
    }
    
    checkHit(keyType) {
        let hit = false;
        let bestCircle = null;
        let bestDistance = Infinity;
        
        // 找到最接近判定位置且类型匹配的音符
        this.circles.forEach(circle => {
            if (circle.hit) return;
            
            // 检查音符类型是否匹配按键类型
            if (circle.type !== keyType) return;
            
            // 计算小圆中心与大圆中心的距离
            const distance = Math.abs(circle.x - this.targetX);
            
            // 如果距离在命中窗口内，记录为候选
            if (distance <= this.hitWindow) {
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCircle = circle;
                }
            }
        });
        
        if (bestCircle) {
            // 根据距离判定准度并处理
            this.hitCircle(bestCircle, bestDistance);
            hit = true;
        } else {
            // 如果没有命中，重置连击
            this.combo = 0;
            this.updateCombo();
        }
    }
    
    hitCircle(circle, distance) {
        circle.hit = true;
        
        // 计算到右上角的距离
        const rect = circle.element.getBoundingClientRect();
        const gameContainer = document.querySelector('.game-container');
        const containerWidth = gameContainer ? gameContainer.offsetWidth : window.innerWidth;
        const targetX = containerWidth - rect.width / 2;
        const targetY = 0;
        const currentX = rect.left + rect.width / 2;
        const currentY = rect.top + rect.height / 2;
        
        const deltaX = (targetX - currentX) / 2; // x轴距离减半
        const deltaY = targetY - currentY;
        
        // 设置自定义动画
        circle.element.style.setProperty('--target-x', deltaX + 'px');
        circle.element.style.setProperty('--target-y', deltaY + 'px');
        
        // 添加命中效果
        circle.element.classList.add('hit-effect');
        
        // 根据距离判定准度（使用缩放后的阈值）
        // 很准：0-hitWindowGreat，大致准：hitWindowGreat-hitWindowGood，有点偏：hitWindowGood-hitWindowBad，完全不准：>hitWindowBad（不显示）
        let accuracy = 'none';
        if (distance <= this.hitWindowGreat) {
            accuracy = 'great';
        } else if (distance <= this.hitWindowGood) {
            accuracy = 'good';
        } else if (distance <= this.hitWindowBad) {
            accuracy = 'bad';
        }
        
        // 更新分数和连击（只有great和good才加分）
        if (accuracy === 'great' || accuracy === 'good') {
            this.score += 10;
            this.combo += 1;
            this.updateScore();
            this.updateCombo();
        } else if (accuracy === 'bad') {
            // bad时重置连击但不加分
            this.combo = 0;
            this.updateCombo();
        }
        
        // 显示准度效果
        if (accuracy !== 'none') {
            this.showAccuracyEffect(accuracy);
        }
        
        // 移除圆（动画结束后）
        setTimeout(() => {
            circle.element.remove();
        }, 800);
    }
    
    showAccuracyEffect(accuracy) {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        if (accuracy === 'great') {
            // 很准：显示great_icon和great.png
            const icon = document.createElement('div');
            icon.className = 'great-icon';
            gameArea.appendChild(icon);
            setTimeout(() => {
                icon.remove();
            }, 400);
            
            const great = document.createElement('div');
            great.className = 'great-text';
            gameArea.appendChild(great);
            setTimeout(() => {
                great.remove();
            }, 500);
        } else if (accuracy === 'good') {
            // 大致准：只显示good.png（不显示great_icon）
            const good = document.createElement('div');
            good.className = 'good-text';
            gameArea.appendChild(good);
            setTimeout(() => {
                good.remove();
            }, 500);
        } else if (accuracy === 'bad') {
            // 有点偏：只显示bad.png（不显示great_icon）
            const bad = document.createElement('div');
            bad.className = 'bad-text';
            gameArea.appendChild(bad);
            setTimeout(() => {
                bad.remove();
            }, 500);
        }
        // accuracy === 'none' 时不显示任何东西
    }
    
    hideStartScreen() {
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
        // 显示dong-gif
        const dongGif = document.querySelector('.dong-gif');
        if (dongGif) {
            dongGif.classList.add('show');
        }
    }
    
    showStartScreen() {
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
        }
        // 隐藏dong-gif
        const dongGif = document.querySelector('.dong-gif');
        if (dongGif) {
            dongGif.classList.remove('show');
        }
    }
    
    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    updateCombo() {
        const comboElement = document.getElementById('combo');
        if (comboElement) {
            comboElement.textContent = this.combo;
        }
    }
}

// 当页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new MusicGame();
});

