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
        const skyColor = 0x87CEEB;
        // Dùng optional chaining (?.) để an toàn hơn
        this.scene.background = new THREE.Color(skyColor);
        this.scene.fog = new THREE.Fog(skyColor, 50, 150);
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