import * as THREE from 'three';

export default class PedestrianGame {
    constructor(scene, assetLoader, envBuilder) {
        this.scene = scene;
        this.loader = assetLoader;
        this.env = envBuilder;
        
        this.playerGroup = new THREE.Group();
        this.obstacles = [];
        this.segments = []; 
        
        this.energy = 100;
        this.isGameOver = false;
        this.playerBox = new THREE.Box3();
        this.obstacleBox = new THREE.Box3();

        // PHẢI dùng this ở đây để init() và update() nhìn thấy
        this.totalStrips = 30; 
        this.stripWidth = 13;
        this.finishLine = -(this.totalStrips * this.stripWidth);
    }

    init(model) {

        // 2. Vòng lặp tạo đường (Dùng this.totalStrips)
        const tempRoad = this.loader.get('road2_model');
        if (tempRoad) {
            tempRoad.rotation.y = Math.PI / 2;
            const box = new THREE.Box3().setFromObject(tempRoad);
            const size = new THREE.Vector3();
            box.getSize(size);
            this.stripWidth = size.z;
            }
            // 1. Nhân vật
            const w = this.stripWidth;
            const sidewalkCenter = (w * 0.125) - (w / 2);

            if (model) {
                this.playerGroup.add(model);
            } else {
                const body = this.loader.createBox(0.6, 1.2, 0.8, 0x0000ff);
                this.playerGroup.add(body);
            }
            this.playerGroup.position.set(0, 0.6, sidewalkCenter);
            this.scene.add(this.playerGroup);

            this.finishLine = -(this.totalStrips * this.stripWidth);

            for (let i = 0; i < this.totalStrips; i++) {
                const zPos = -i * this.stripWidth;
                const strip = this.createStrip(zPos);
                this.segments.push(strip);
                this.scene.add(strip);

            }

            // 3. Cổng (Dùng this.finishLine)
            this.gate = this.loader.get('gate_kieu_mai');
            if (this.gate) {
                this.gate.position.set(0, 0, this.finishLine); 
                this.scene.add(this.gate);
            }
        }
    

    createStrip(zPos) {
        const group = new THREE.Group();
    
        // Xác định xem dải này là vỉa hè hay đường
        const stripIndex = Math.round(Math.abs(zPos) / this.stripWidth);
        const isSidewalkStrip = (stripIndex % 2 === 0); // Cứ mỗi 2 dải thì có 1 vỉa hè

        // Lấy model tương ứng
        const modelName = isSidewalkStrip ? 'sidewalk_model' : 'road2_model';
        const mesh = this.loader.get(modelName);

        if (mesh) {
            mesh.rotation.y = Math.PI / 2;
            // Căn chỉnh model vào tâm group
            const box = new THREE.Box3().setFromObject(mesh);
            const center = new THREE.Vector3();
            box.getCenter(center);
            mesh.position.sub(center);
            group.add(mesh);
        }

        group.position.set(0, 0, zPos);

        // Chỉ sinh xe nếu KHÔNG PHẢI vỉa hè
        if (!isSidewalkStrip) {
            const w = this.stripWidth;
            // Chia làn đường (Giả sử road2_model có 3 làn xe)
            const laneWidth = w / 3;
            const lanesZ = [ -w/3, 0, w/3 ]; 
        
            for (let i = 0; i < 3; i++) {
                const car = this.loader.get('car_shared');
                if (car) {
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    const speed = (0.05 + Math.random() * 0.1) * direction;
                
                    // Xe chạy ngang (theo trục X)
                    car.position.set(Math.random() * 40 - 20, 0, lanesZ[i]); 
                    car.userData = { speed };
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

        this.energy -= deltaTime * 0.25; // Giảm năng lượng theo thời gian
        this.playerBox.setFromObject(this.playerGroup);
        this.playerBox.expandByScalar(-0.15);

        // Di chuyển xe chạy ngang đường
        for (let car of this.obstacles) {
            car.position.x += car.userData.speed * 100 * deltaTime;
            if (car.position.x > 20) car.position.x = -20;
            if (car.position.x < -20) car.position.x = 20;

            car.updateMatrixWorld();
            this.obstacleBox.setFromObject(car);
            if (this.playerBox.intersectsBox(this.obstacleBox)) {
                this.handleCollision();
                return "COLLIDED";
            }
        }

        if (this.gate) {
            this.obstacleBox.setFromObject(this.gate);
            if (this.playerBox.intersectsBox(this.obstacleBox)) {
                return "WIN";
            }
        }

        if (this.energy <= 0) return "LOSE";
        if (this.playerGroup.position.z <= this.finishLine) return "WIN";

        return "PLAYING";
    }

    handleInput(keyCode) {
        const step = this.stripWidth/3;
        const limitX = (this.stripWidth /2) -0.5;

        if (keyCode === 'ArrowUp') this.playerGroup.position.z -= step;
        if (keyCode === 'ArrowDown') this.playerGroup.position.z += step;
        if (keyCode === 'ArrowLeft') this.playerGroup.position.x -= step;
        if (keyCode === 'ArrowRight') this.playerGroup.position.x += step;

        this.playerGroup.position.x = Math.max(-limitX, Math.min( limitX, this.playerGroup.position.x));
    }

    handleCollision() {
        this.energy -= 10;

        const w= this.stripWidth;
        const currentStripIndex = Math.round(-this.playerGroup.position.z / w);
        const safeZoneIndex = Math.floor(currentStripIndex / 2) * 2;
    
        this.playerGroup.position.z = -(safeZoneIndex * w);
        this.playerGroup.position.x = 0;
    }

    clear() {
        this.scene.remove(this.playerGroup);
        this.obstacles.forEach(o => this.scene.remove(o));
        this.segments.forEach(s => this.scene.remove(s));
        this.obstacles=[];
        this.segments = [];
        if (this.gate) this.scene.remove(this.gate);
    }
}