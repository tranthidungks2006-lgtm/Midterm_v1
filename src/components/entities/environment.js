import * as THREE from 'three';

export class Environment {
    constructor(assetLoader, scene) {
        this.loader = assetLoader;
        this.scene = scene;

        // Kiểm tra xem scene có tồn tại không trước khi làm việc
        if (this.scene) {
            this.createSky();
        } else {
            console.warn("Environment: Scene chưa được truyền vào!");
        }
    }

    createSky() {
        // 1. Tạo một Canvas ảo để vẽ dải màu
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512; // Chiều cao lớn để dải màu mịn
        const context = canvas.getContext('2d');

        // 2. Tạo Gradient: Xanh nhạt ở trên (0), Xanh đậm ở dưới (1)
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#6cd4fe'); // Xanh nhạt (Đỉnh bầu trời)
        gradient.addColorStop(1, '#164b9f'); // Xanh đậm (Chân trời)

        // Tô màu vào canvas
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);

        // 3. Biến Canvas thành Texture và gán làm nền Scene
        const backgroundTexture = new THREE.CanvasTexture(canvas);
        this.scene.background = backgroundTexture;

        // 4. Thêm sương mù trùng màu với đáy (Xanh đậm) để hòa quyện
        this.scene.fog = new THREE.Fog(0xffffff, 50, 150);
    }

    createRoadSegment(mode, zPos) {
        const group = new THREE.Group();

        // 1. Lấy model đường xe máy (r1.glb)
        const road = this.loader.get('road_model');
        if (road) {
            const roadClone = road.clone();
            group.add(roadClone);
        } else {
            console.error("Không tìm thấy road_model cho game xe máy!");
        }

       // Ngoại cảnh: Vỉa hè & Cây cối random
        for (let i = 0; i < 4; i++) {
            const tree = this.loader.get('tree_shared');
            const side = Math.random() > 0.5 ? 7 : -7;
            tree.position.set(side, 1.5, (Math.random() - 0.5) * 40);
            group.add(tree);
        }

        group.position.z = zPos;
        return group;
    }

}