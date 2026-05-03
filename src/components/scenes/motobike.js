import * as THREE from 'three';

export default class MotobikeGame {
    constructor(scene, assetLoader, envBuilder) {
        this.scene = scene;
        this.loader = assetLoader;
        this.env = envBuilder;
        
        this.playerGroup = new THREE.Group();
        this.segments = [];
        this.obstacles = [];
        this.currentLane = 0;
        this.score = 0;
        this.isGameOver = false;

        this.distanceToGoal = 2000; 
        this.gateSpawned = false;
        this.gate = null;
        
        this.playerBox = new THREE.Box3();
        this.obstacleBox = new THREE.Box3();

        this.minGap = 10;
    }

    init(model) {
        if (model) {
            this.playerGroup.add(model);
        } else {
            const body = this.loader.createBox(0.8, 1.5, 0.4, 0x00ff00);
            this.playerGroup.add(body);
        }
        
        this.playerGroup.position.set(0, 0, 5);
        this.scene.add(this.playerGroup);

        this.numSegments = 3; // Số đoạn đường
        const tempRoad = this.loader.get('road_model');
        const box = new THREE.Box3().setFromObject(tempRoad);
        this.roadLength = box.max.z - box.min.z;

        const roadWidth = box.max.x - box.min.x;

        const roadRaito = 0.3
        this.laneDistance = (roadWidth * roadRaito) / 3; 
    
    // Nếu laneDistance đo ra lỗi hoặc bằng 0, gán mặc định cho an toàn
        if (this.laneDistance <= 0) this.laneDistance = 3.3;

        if (this.roadLength <= 0) this.roadLength = 50;
        this.numSegments = 4;

        for (let i = 0; i < this.numSegments; i++) {
            const seg = this.env.createRoadSegment('motobike', i * -this.roadLength);
            console.log(`Đoạn đường ${i} đang ở Z: ${seg.position.z}, RoadLength: ${this.roadLength}`);
            this.segments.push(seg);
            this.scene.add(seg);
        }

// --- KHỞI TẠO DÃY PHỐ (CITY SEGMENTS) ---
const cityAsset = this.loader.get('building_model');
const cityBox = new THREE.Box3().setFromObject(cityAsset);
this.cityBlockLength = cityBox.max.z - cityBox.min.z; 

this.citySegments = [];
// Số lượng segment dãy phố (nên khớp với số lượng segment đường để đồng bộ)
this.numCitySegments = this.numSegments || 4; 

const cityMargin = 1; // Khoảng cách từ mép đường đến dãy phố
const citySideOffset = (roadWidth / 2) + cityMargin;

for (let i = 0; i < this.numCitySegments; i++) {
    // Tạo 2 dãy phố cho 2 bên đường
    const leftSide = cityAsset.clone();
    const rightSide = cityAsset.clone();

    const zPos = i * -this.cityBlockLength;

    // Đặt vị trí bên trái
    leftSide.position.set(-citySideOffset, 0, zPos);
    
    // Đặt vị trí bên phải và xoay mặt lại (nếu cần)
    rightSide.position.set(citySideOffset, 0, zPos);
    rightSide.rotation.y = Math.PI;

    this.scene.add(leftSide);
    this.scene.add(rightSide);

    // Lưu vào mảng để quản lý update
    this.citySegments.push({ left: leftSide, right: rightSide });
}    }

    // Đổi tên cho đồng nhất với hàm update
    spawnObstacle(excludeLane = null) {
        const types = ['car_shared', 'obstacle_cone', 'sign_post'];
        const type = types[Math.floor(Math.random() * types.length)];
        const obstacle = this.loader.get(type);
        
        const lanes = [-3, 0, 3];
        const availableLanes = excludeLane !== null 
            ? lanes.filter(l => l !== excludeLane) 
            : lanes;
        let selectedLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

        obstacle.position.set(selectedLane, 0, -120);
        
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);

        return selectedLane; // Trả về lane đã spawn để có thể dùng làm excludeLane cho lần spawn tiếp theo nếu cần 
    }

    update(speed) {
        if (this.isGameOver) return "STOP";
        this.distanceToGoal -= speed;

        if (this.distanceToGoal > 100) {
            const spawnChance = 0.25;
            let canSpawn = true; // Đổi mặc định thành true

            if (this.obstacles.length > 0) {
                const lastObs = this.obstacles[this.obstacles.length - 1];
                const dynamicMinGap = this.minGap + (speed * 15);
                
                // Nếu khoảng cách tới điểm spawn (-120) còn quá gần thì không cho spawn
                if (Math.abs(lastObs.position.z - (-120)) < dynamicMinGap) {
                    canSpawn = false;
                }
            }

            if (canSpawn && Math.random() < spawnChance) { 

                const firstLane = this.spawnObstacle();
                if (Math.random() < 0.4) {
                    // Sinh cái thứ hai và bắt nó né cái firstLane ra
                    this.spawnObstacle(firstLane);
                }
            }
        }

        // 1. Di chuyển đường
        const totalLength = this.numSegments * this.roadLength;
        this.segments.forEach(seg => {
            seg.position.z += speed;
            if (seg.position.z > this.roadLength) seg.position.z -= totalLength;
        });

        // 3. Va chạm & Di chuyển vật cản
        this.playerBox.setFromObject(this.playerGroup).expandByScalar(-0.15);

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z += speed;

            this.obstacleBox.setFromObject(obs);
            
            if (this.playerBox.intersectsBox(this.obstacleBox)) {
                this.isGameOver = true;
                return "LOSE";
            }

            if (obs.position.z > 20) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
                this.score++; 
            }
        }
 
        // 4. Đích đến
        if (this.distanceToGoal <= 0 && !this.gateSpawned) {
            this.gate = this.loader.get('gate_kieu_mai');
            this.gate.position.set(0, 0, -150);
            this.scene.add(this.gate);
            this.gateSpawned = true;
        }

        if (this.gate) {
            this.gate.position.z += speed;
            this.obstacleBox.setFromObject(this.gate);
            if (this.playerBox.intersectsBox(this.obstacleBox)) {
                return "WIN";
            }
        }

        return "PLAYING";
    }

    updateBuildings(speed, deltaTime) {
        const totalCycle = (this.buildingCount / 2) * this.buildingSpacing;

        for (let i = 0; i < this.buildingCount; i++) {
            this.buildings.getMatrixAt(i, this.dummy.matrix);
            this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale);

            // Tòa nhà trôi về phía sau
            this.dummy.position.z += speed * deltaTime;

            // Nếu vượt quá 1 khoảng phía sau người chơi (ví dụ 20 đơn vị), teleport lên phía xa nhất
            if (this.dummy.position.z > 20) {
                this.dummy.position.z -= totalCycle;
            }

            this.dummy.updateMatrix();
            this.buildings.setMatrixAt(i, this.dummy.matrix);
        }
        this.buildings.instanceMatrix.needsUpdate = true;
    }

    handleInput(keyCode) {
        if (this.isGameOver) return;
        if (keyCode === 'ArrowLeft') this.currentLane = Math.max(-1, this.currentLane - 1);
        if (keyCode === 'ArrowRight') this.currentLane = Math.min(1, this.currentLane + 1);

        this.playerGroup.position.x = this.currentLane * this.laneDistance;
    }

    // Trong motobike.js
    clear() {
        // 1. Xóa nhân vật
        if (this.playerGroup) {
            this.scene.remove(this.playerGroup);
        }

        // 2. Xóa các đoạn đường
        this.segments.forEach(seg => {
            this.scene.remove(seg);
        });
        this.segments = [];

        // 3. Xóa vật cản (xe, nấm, biển báo)
        this.obstacles.forEach(obs => {
            this.scene.remove(obs);
        });
        this.obstacles = [];

        // 4. Xóa các tòa nhà hai bên phố
        if (this.citySegments) {
            this.citySegments.forEach(seg => {
                this.scene.remove(seg.left);
                this.scene.remove(seg.right);
            });
            this.citySegments = [];
        }

        // 5. Xóa cổng UET nếu đã hiện
        if (this.gate) {
            this.scene.remove(this.gate);
            this.gate = null;
        }

        console.log("🧹 Đã dọn dẹp sạch sẽ Game Xe Máy!");
    }
}