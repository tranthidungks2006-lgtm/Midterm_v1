import * as THREE from 'three';
import { AssetLoader } from './components/entities/assetLoader.js';
import { Environment } from './components/entities/environment.js';
import IntroScene from './components/scenes/intro.js';
import MotobikeGame from './components/scenes/motobike.js';
import PedestrianGame from './components/scenes/Pedestrian.js';
import { loadModel } from './utils/Loader.js';
import { initLeaderboard, showLeaderboard, hideLeaderboard } from './components/scenes/leaderboard.js';

class WayfinderManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#game-canvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.assetLoader = new AssetLoader();
        this.envBuilder = null;
        this.currentGame = null;
        this.intro = null;
        this.currentStage = 'LOADING';

        this.startTime = 0;
        this.isAccelerating = false;
        this.playerName = 'Ẩn danh'; // Lấy từ intro
        this.currentMode = null;

        // UI Elements
        this.timeDisplay = document.getElementById('time-val');
        this.scoreDisplay = document.getElementById('score-val');

        this.setupLights();
        this.start();
        this.setupEventListeners(); // Gọi hàm lắng nghe phím ngay từ đầu
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(5, 15, 10);
        this.scene.add(sunLight);
    }

    async start() {
        try {
            console.log("Bắt đầu nạp tài nguyên...");
            
            // 1. Nạp tài nguyên tối thiểu
            await this.assetLoader.loadMinimal();

            // 2. Khởi tạo các thành phần cảnh
            this.envBuilder = new Environment(this.assetLoader, this.scene);
            this.intro = new IntroScene(this.scene, this.assetLoader);
            this.intro.init();

            // 3. TRÁO ĐỔI MÀN HÌNH
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.classList.add('hidden'); 

            const introScreen = document.getElementById('intro-screen');
            if (introScreen) introScreen.classList.remove('hidden'); 

            // 4. Thiết lập trạng thái
            this.currentStage = 'INTRO';
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);

            this.setupUI();
            initLeaderboard(); // bind nút X và Chơi lại trong leaderboard
            this.animate();

            this.assetLoader.loadHiddenAssets().then(() => {
            });
            
        } catch (error) {
            console.error("kkk, you're failure cat", error);
            // Nếu sập thì ít nhất cũng phải báo cho người ta biết
            const loadingText = document.querySelector('#loading-screen div');
            if (loadingText) loadingText.innerText = "LỖI KHỞI TẠO: " + error.message;
        }
    }

    setupUI() {
        // Play -> Tutorial
        document.getElementById('play-btn').onclick = () => {
            const nameInput = document.getElementById('player-name-input');
            this.playerName = nameInput?.value.trim() || 'Ẩn danh';
            document.getElementById('intro-screen').classList.add('hidden');
            document.getElementById('tutorial-screen').classList.remove('hidden');
            
        };

        // Tutorial -> Selection
        document.getElementById('tutorial-next-btn').onclick = () => {
            document.getElementById('tutorial-screen').classList.add('hidden');
            document.getElementById('selection-screen').classList.remove('hidden');
        };

        // Chọn Motobike
        document.getElementById('choose-motobike').onclick = () => {
            this.currentMode = 'motobike';
            this.handleModeSelection('motobike');
        };

        // Chọn Pedestrian
        document.getElementById('choose-pedestrian').onclick = () => {
            this.currentMode = 'pedestrian';
            this.handleModeSelection('pedestrian');
        };
    }

    async startGame(type) {
        if (this.intro) this.intro.clear();
        if (this.currentGame) this.currentGame.clear();

        try {
            // LẤY MODEL THẬT ĐÃ NẠP
            let playerModel;
            if (type === 'motobike') {
                playerModel = this.assetLoader.get('player2'); 
                this.currentGame = new MotobikeGame(this.scene, this.assetLoader, this.envBuilder);
            } else {
                playerModel = this.assetLoader.get('player'); 
                this.currentGame = new PedestrianGame(this.scene, this.assetLoader, this.envBuilder);
            }

            // Khởi tạo game với model thật
            this.currentGame.init(playerModel);

            document.getElementById('game-stats').classList.remove('hidden');
            this.startTime = Date.now();
            this.currentStage = 'GAMEPLAY';

        } catch (error) {
            console.error("Lỗi khi vào gameplay:", error);
            alert('kkk, you are failure cat');
        }
    }

    async onSelectMode(mode) {
        showLoadingScreen();
        await this.assetLoader.loadModeAssets(mode); // ĐỢI NẠP XONG HẾT
        this.startGame(); // RỒI MỚI CHẠY
    }

    async handleModeSelection(mode) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        // 1. Hiện màn hình loading cho Load 2
        const loadingBarContainer = document.getElementById('mode-loading-bar'); 

        if (loadingBarContainer){
            loadingBarContainer.classList.remove('hidden');
            const barFill = document.getElementById('loading-bar-fill');
            if (barFill) barFill.style.width = '0%';
        }

        // 2. Chờ nạp model cụ thể 
        console.log(`Đang nạp model cho chế độ: ${mode}`);

        try {
            await this.assetLoader.loadModeAssets(mode);
        } catch (error) {
            console.warn("Không tìm thấy model thật!", error);
        }

        // 3. Nạp xong thì ẩn loading và bắt đầu game
        if (loadingBarContainer) loadingBarContainer.classList.add('hidden');

        document.getElementById('intro-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('tutorial-screen').classList.add('hidden');

    
        // Chuyển stage sang GAME
        this.isTransitioning = false;
        await this.startGame(mode);
        this.currentStage = 'GAMEPLAY';
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.currentStage === 'GAMEPLAY' && this.currentGame) {
                this.currentGame.handleInput(e.code);
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.isAccelerating = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.isAccelerating = false;
        });
    }

    update() {
        if (this.currentStage === 'INTRO' && this.intro) {
            this.intro.update();
        } 
        else if (this.currentStage === 'GAMEPLAY' && this.currentGame) {
            // Cập nhật thời gian
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            if (this.timeDisplay) this.timeDisplay.innerText = elapsed;

            // Chạy logic game
            const speed = this.isAccelerating ? 0.5 : 0.2;
            const status = (this.currentGame instanceof PedestrianGame)
                ? this.currentGame.update(0.016)
                : this.currentGame.update(speed);

            // Cập nhật điểm/năng lượng
            if (this.scoreDisplay) {
                this.scoreDisplay.innerText = (this.currentGame instanceof PedestrianGame)
                    ? Math.floor(this.currentGame.energy)
                    : this.currentGame.score;
            }

            // Camera bám theo (Y và Z offset)
            if (this.currentGame.playerGroup) {
                const playerZ = this.currentGame.playerGroup.position.z;
                 if (this.currentGame instanceof PedestrianGame) {
                    // Xoay camera 30 độ ngang quanh trục Y
                    const angle = 30 * Math.PI / 180;
                    const dist = 10;
                    this.camera.position.set(
                        dist * Math.sin(angle),        // ~5
                        8,
                        playerZ + dist * Math.cos(angle) // ~8.66
                    );
                    this.camera.lookAt(0, 0, playerZ - 2);
                } else {
                    // Motobike giữ nguyên
                    this.camera.position.set(0, 8, playerZ + 10);
                    this.camera.lookAt(0, 0, playerZ - 5);
                }
            }
            
            // Xử lý thắng thua
            if (status === "LOSE") {
                this.currentStage = 'FINISHED';
                this.showEndScreen(status);
            } else if (status === "WIN") {
                this.currentStage = 'FINISHED';
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.showWinScreen(elapsed); // → Win screen → LB với callback restart
            }
        }
    }

    showWinScreen(elapsed) {
        const screen = document.getElementById('win-screen');
        const okBtn  = document.getElementById('win-ok-btn');
        if (!screen) return;
        screen.classList.remove('hidden');
 
        okBtn.onclick = () => {
            screen.classList.add('hidden');
            showLeaderboard(this.playerName, this.currentMode, elapsed, () => this.restartToSelection());
        };
    }

    restartToSelection() {
        hideLeaderboard();
        if (this.currentGame) { this.currentGame.clear(); this.currentGame = null; }
        document.getElementById('game-stats').classList.add('hidden');
        document.getElementById('game-over-screen')?.classList.add('hidden');
        document.getElementById('win-screen')?.classList.add('hidden');
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        document.getElementById('selection-screen').classList.remove('hidden');
        this.currentStage = 'INTRO';
    }

    showEndScreen(status) {
        const screen = document.getElementById('game-over-screen');
        const title = document.getElementById('result-title');
        const msg = document.getElementById('result-message');
        const retryBtn = document.getElementById('retry-btn');

        title.innerText = "GAME OVER";
        title.style.color = "#FF5252";
        msg.innerText = "Chưa tày đâuuu!";
        screen.classList.remove('hidden');
 
        retryBtn.onclick = () => this.restartToSelection();
        }
        
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new WayfinderManager();