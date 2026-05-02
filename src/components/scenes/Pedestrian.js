import * as THREE from 'three';

export default class PedestrianGame {
    constructor(scene, assetLoader, envBuilder) {
        this.scene = scene;
        this.loader = assetLoader;
        this.env = envBuilder;
        
        
        this.playerGroup = new THREE.Group();
        this.obstacles = [];
        this.segments = []; 
        this.treeObstacles = [];
        
        this.energy = 100;
        this.isGameOver = false;
        this.playerBox = new THREE.Box3();
        this.obstacleBox = new THREE.Box3();

        this.totalStrips = 30; 
        this.roadWidth = 0;
        this.sidewalkWidth = 0;
        this.step = 0; // Bước nhảy chuẩn
        this.finishLine = -9999; // Fix lỗi thắng sớm: Khởi tạo giá trị âm lớn
    }

    init(model) {
        const tempRoad = this.loader.get('road2_model');
        const tempSidewalk = this.loader.get('sidewalk_model');

        if (tempRoad && tempSidewalk) {
            tempRoad.rotation.y = Math.PI / 2;
            tempSidewalk.rotation.y = Math.PI / 2;

            const roadBox = new THREE.Box3().setFromObject(tempRoad);
            this.roadWidth = roadBox.getSize(new THREE.Vector3()).z;
            
            // Theo yêu cầu: vỉa hè bằng 1/3 đường, bước nhảy bằng 1/3 đường
            this.step = this.roadWidth / 3;
            this.sidewalkWidth = this.step; 
        }

        // 1. Cài đặt nhân vật
        if (model) {
            this.playerGroup.add(model);
        } else {
            const body = this.loader.createBox(0.6, 1.2, 0.8, 0x0000ff);
            this.playerGroup.add(body);
        }
        this.playerGroup.position.set(0, 0.6, -this.step / 2); // Bắt đầu tại z = 0
        this.scene.add(this.playerGroup);

        // 2. Tạo đường (Nối đuôi nhau)
        let currentZ = 0;
        for (let i = 0; i < this.totalStrips; i++) {
            const isSidewalk = (i % 2 === 0);
            const currentWidth = isSidewalk ? this.sidewalkWidth : this.roadWidth;
            
            // Đặt tâm của dải sao cho mép trước của nó nối tiếp mép sau dải cũ[cite: 5]
            const posZ = currentZ - (currentWidth / 2);
            const strip = this.createStrip(posZ, i, currentWidth);
            this.segments.push(strip);
            this.scene.add(strip);
            
            currentZ -= currentWidth;
        }
        this.finishLine = currentZ; // Điểm thắng là cuối dải cuối cùng[cite: 5]

        // 3. Cổng
        this.gate = this.loader.get('gate_kieu_mai');
        if (this.gate) {
            this.gate.position.set(0, 0, this.finishLine); 
            this.scene.add(this.gate);
        }
    }

    createStrip(zPos, index, width) {
        const group = new THREE.Group();
        const isSidewalkStrip = (index % 2 === 0);
        const mesh = this.loader.get(isSidewalkStrip ? 'sidewalk_model' : 'road2_model');

        if (mesh) {
            mesh.rotation.y = Math.PI / 2;
            mesh.scale.z = 2;
            const box = new THREE.Box3().setFromObject(mesh);
            const center = new THREE.Vector3();
            box.getCenter(center);

            mesh.position.x = -center.x; 
            mesh.position.y = -box.min.y;
            mesh.position.z = -center.z;
            group.add(mesh);
        }
        group.position.set(0, 0, zPos);

        if (isSidewalkStrip) {
            if (index > 0) {
                const treeCount = 4; 
                const positionsX = [-this.step * 2, -this.step, this.step, this.step * 2];
                positionsX.sort(() => Math.random() - 0.5);
                for (let i = 0; i < treeCount; i++) {
                    const tree = this.loader.get('tree_shared');
                    if (tree) {
                        tree.position.set(positionsX[i], 0, 0);
                        group.add(tree);
                        tree.updateMatrixWorld(true);
                        const treeBox = new THREE.Box3().setFromObject(tree);
                        this.treeObstacles.push(treeBox);
                    }
                }
            }
        } else {
            const lanesZ = [-this.step, 0, this.step ]; // Làn đường chia theo bước nhảy
            for (let i = 0; i < 3; i++) {
                const car = this.loader.get('car_shared');
                if (car) {
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    car.position.set(Math.random() * 100 - 50, 0, lanesZ[i]); 
                    car.userData = { speed: (0.05 + Math.random() * 0.1) * direction };
                    car.rotation.y = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
                    group.add(car);
                    this.obstacles.push(car);
                }
            }
        }
        return group;
    }

    update(deltaTime) {
        if (this.isGameOver) return "STOP";
        this.energy -= deltaTime * 0.25;

        // Xử lý xe chạy
        for (let car of this.obstacles) {
            car.position.x += car.userData.speed * 100 * deltaTime;
            if (car.position.x > 20) car.position.x = -20;
            if (car.position.x < -20) car.position.x = 20;

            car.updateMatrixWorld();
            this.obstacleBox.setFromObject(car);
            this.playerBox.setFromObject(this.playerGroup);
            if (this.playerBox.intersectsBox(this.obstacleBox)) {
                this.handleCollision();
                return "COLLIDED";
            }
        }

        if (this.energy <= 0) return "LOSE";
        // Chỉ thắng khi vượt qua vạch đích (số âm nhỏ hơn finishLine)[cite: 5]
        if (this.playerGroup.position.z <= this.finishLine) return "WIN";

        return "PLAYING";
    }

    handleInput(keyCode) {
        if (this.isGameOver) return;
        const oldPos = this.playerGroup.position.clone();

        if (keyCode === 'ArrowUp') this.playerGroup.position.z -= this.step;
        if (keyCode === 'ArrowDown') this.playerGroup.position.z += this.step;
        if (keyCode === 'ArrowLeft') this.playerGroup.position.x -= this.step;
        if (keyCode === 'ArrowRight') this.playerGroup.position.x += this.step;

        const limitX = (this.roadWidth) - 0.5;
        this.playerGroup.position.x = Math.max(-limitX, Math.min(limitX, this.playerGroup.position.x));

        this.playerGroup.updateMatrixWorld(true);
        this.playerBox.setFromObject(this.playerGroup);
        this.playerBox.expandByScalar(-0.2); // Thu nhỏ box nhân vật một chút để di chuyển mượt hơn[cite: 3]

        for (let treeBox of this.treeObstacles) {
            if (this.playerBox.intersectsBox(treeBox)) {
                // Nếu chạm cây, quay về vị trí cũ (không cho đi qua)[cite: 5]
                this.playerGroup.position.copy(oldPos);
                break;
            }
        }
    }

    handleCollision() {
        this.energy -= 10;
        // Vị trí hợp lệ luôn là -(2k+1)*step/2 → tính k từ position hiện tại
        const k = Math.round(Math.abs(this.playerGroup.position.z) / this.step - 0.5);
        // Vỉa hè ở k = 0, 4, 8, ... (1 vỉa hè + 3 làn = 4 bước)
        const safeK = Math.floor(k / 4) * 4;
        // Reset về tâm vỉa hè gần nhất, giữ đúng lưới half-step
        this.playerGroup.position.z = -(safeK * this.step + this.step / 2);
        this.playerGroup.position.x = 0;
    }
    

    // Trong Pedestrian.js
    clear() {
        // 1. Xóa nhân vật
        if (this.playerGroup) {
            this.scene.remove(this.playerGroup);
        }

        // 2. Xóa các dải đường (cây và xe trong dải cũng sẽ mất theo)
        this.segments.forEach(strip => {
            this.scene.remove(strip);
        });
        this.segments = [];

        // 3. Reset các mảng quản lý va chạm để ván sau không bị lỗi logic
        this.obstacles = [];
        this.treeObstacles = [];

        // 4. Xóa cổng UET
        if (this.gate) {
            this.scene.remove(this.gate);
            this.gate = null;
        }

        console.log("🧹 Đã dọn dẹp sạch sẽ Game Đi Bộ!");
    }
}