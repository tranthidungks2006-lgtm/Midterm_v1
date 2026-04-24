import * as THREE from 'three';

export default class IntroScene {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.group = new THREE.Group();
        this.mesh = null;
        this.bananas = [];
    }

    init() {

        this.bananas = []; // Mảng chứa các quả chuối
        if (!this.assetLoader) {
            console.error("AssetLoader chưa được truyền vào Intro!");
            return;
        }
        const bananaModel = this.assetLoader.get('banana_model');

        for (let i = 0; i < 35; i++) {
            const banana = bananaModel.clone();
        
            // Đặt vị trí ngẫu nhiên trên trời
            banana.position.set(
                (Math.random() - 0.5) * 10, // X: từ -5 đến 5
                Math.random() * 20 + 10,    // Y: từ 10 đến 30 (trên cao)
                (Math.random()*5 + 5)  // Z: từ 5 đến 10
            );
        
            // Cho mỗi quả một tốc độ rơi và xoay khác nhau cho tự nhiên
            banana.userData = {
                fallSpeed: Math.random() * 0.08 + 0.05,
                rotSpeed: Math.random() * 0.05
            };

            this.scene.add(banana);
            this.bananas.push(banana);
        }
        // Tạo nhân vật tạm thời (Box3)
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.group.add(this.mesh);
        this.scene.add(this.group);
        
        // Đặt vị trí trung tâm để xoay
        this.group.position.set(0, 0, 0);

        
    }

    update() {

        if (this.introModel) this.introModel.rotation.y += 0.01;

    // 2. Logic cho chuối rơi
        this.bananas.forEach(banana => {
            banana.position.y -= banana.userData.fallSpeed; // Rơi xuống
            banana.rotation.x += banana.userData.rotSpeed;  // Xoay tròn
            banana.rotation.z += banana.userData.rotSpeed;

            // Nếu rơi quá mặt đất (y < -5), đưa nó trở lại lên trời để rơi tiếp
            if (banana.position.y < -5) {
                banana.position.y = 20;
                banana.position.x = (Math.random() - 0.5) * 20;
            }
        });

        if (this.mesh) {
            this.mesh.rotation.y += 0.02; // Xoay tròn nhân vật
            this.mesh.rotation.x += 0.01;
        }
    }

    clear() {
        this.scene.remove(this.group);
        this.bananas.forEach(banana => {
        this.scene.remove(banana);
    });
    this.bananas = [];
    }
}