import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';

export class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.models = {};
        this.loadingManager = new THREE.LoadingManager();
        this.isReady = false;
        this.isLoadingMode = false;
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    }

    _centerModel(model) {
        if (!model) return null;

        // 1. Tính toán khung bao quanh (Bounding Box)
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // 2. Dịch chuyển mesh để đưa X, Z về tâm và Y về đáy (mặt đất)
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y; // Đưa điểm thấp nhất về y = 0

        // 3. Bọc vào một Group để "đóng gói" tọa độ mới
        const wrapper = new THREE.Group();
        wrapper.add(model);
        return wrapper;
    }

    // Giai đoạn 1: Chỉ nạp những gì cực nhẹ để hiện Intro ngay lập tức
    async loadMinimal() {
        console.log("Đang nạp tài nguyên tối thiểu...");
        this.models['sign_post'] = this.createBox(0.2, 2.5, 0.2, 0x777777);
        this.models['road_model'] = this.createBox(10, 0.1, 52, 0x555555);
        this.models['road2_model'] = this.createBox(10, 0.1, 50, 0x555555);
        this.models['sidewalk_model'] = this.createBox(10, 0.1, 50, 0x555555);
        this.models['car_shared'] = this.createBox(1.8, 1.2, 3.5, 0xff0000);
        this.models['obstacle_cone'] = this.createBox(0.5, 1, 0.5, 0xffa500);
        this.models['tree_shared'] = this.createBox(0.5, 3, 0.5, 0x228B22);
        this.models['gate_kieu_mai'] = this.createBox(12, 8, 2, 0x8B4513);

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(this.dracoLoader);

        // Nạp model quả chuối cho Intro
        console.log("🍌 Đang nạp model chuối...");
        try {
            const bananaScene = await this._loadModel(gltfLoader, './model/chuoi.glb');
            if (bananaScene) {
                const centeredBanana = this._centerModel(bananaScene);
                this.assets.set('banana_model', centeredBanana);
                console.log("✅ Đã nạp xong chuối!");
            }
        } catch (error) {
            console.error("❌ Không tìm thấy file banana.glb, tạo chuối giả nè:");
            // Tạo đồ giả nếu nạp lỗi để game không bị crash
            const fakeBanana = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 1, 0.5),
                new THREE.MeshStandardMaterial({ color: 0xffd700 }) // Màu vàng chuối
            );
            this.assets.set('banana_model', fakeBanana);
        }
    
        this.isReady = true;
        return Promise.resolve();
        }

    // Giai đoạn 2: Nạp ngầm các model .glb nặng nề khi người chơi đang ở Intro
    async loadHiddenAssets() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(this.dracoLoader);

        const commonFiles = [
           { name: 'gate_kieu_mai', path: './model/UET.glb' },
           // { name: 'tree_shared', path: './model/Tree_UET.glb' }
        ];

        for (const file of commonFiles) {
            const scene = await this._loadModel(gltfLoader, file.path);
            if (scene) this.assets.set(file.name, this._centerModel(scene));
        }

        console.log("Đã nạp ngầm xong Cây và Cổng Kiều Mai!");
    }

    async loadModeAssets(mode) {
        if (this.isLoadingMode) return;
        this.isLoadingMode = true;
        this.isReady = false;

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(this.dracoLoader);

        const barFill = document.getElementById('loading-bar-fill');

        const files = (mode === 'motobike') ? [
            { name: 'road_model', path: './model/r1.glb' },
            { name: 'sign_post', path: './model/d1.glb' },
            { name: 'sign_post', path: './model/d2.glb' },
            { name: 'sign_post', path: './model/d4.glb' },
            { name: 'obstacle_cone', path: './model/rac.glb'},
            { name: 'obstacle_cone', path: './model/chan.glb'},
            //{ name: 'player', path: './model/Motorbike.glb' }
        ] : [
            { name: 'road2_model', path: './model/r2.glb' },
            { name: 'sidewalk_model', path: './model/s2.glb' },
            //{ name: 'player', path: './model/Man_Walking.glb' }
        ];

        for (const file of files) {
            const scene = await this._loadModel(gltfLoader, file.path);
            if (scene) {
                const centered = this._centerModel(scene);
                if (this.assets.has(file.name)) {
                    const existing = this.assets.get(file.name);
                    if (Array.isArray(existing)) {
                        existing.push(centered);
                    } else {
                        this.assets.set(file.name, [existing, centered]);
                    }
                } else {
                    this.assets.set(file.name, centered);
                }
                console.log(`✅ Đã nạp xong: ${file.name}`);
            }
            let loaded = files.indexOf(file) + 1;
            if (barFill) barFill.style.width = `${(loaded / files.length) * 100}%`;
        }
        this.isReady = true;
        this.isLoadingMode = false;
    }

    _loadModel(loader, path) {
        return new Promise((resolve) => {
            loader.load(path, (gltf) => resolve(gltf.scene), undefined, () => resolve(null));
        });
    }

    get(name) {
        // 1. Kiểm tra xem có model thật (.glb) trong Map assets không
        if (this.assets.has(name)) {
            const asset = this.assets.get(name);

            if (Array.isArray(asset)){
                const randomIndex = Math.floor(Math.random() * asset.length);
                return asset[randomIndex].clone();
            }
            return asset.clone();
        }

        // 2. Nếu không có đồ thật, mới lục thùng đồ giả (models)
        if (this.models[name]) {
            // Nếu đồ thật chưa nạp xong, ít nhất phải hiện cái Box để em thấy đường mà chạy
            console.warn(`Đang dùng tạm Box cho ${name} vì đồ thật chưa nạp kịp!`);
            return this.models[name].clone();
        }

        console.warn(`Không tìm thấy gì cho: ${name}`);
        return this.createBox(1, 1, 1, 0xffffff);
    }

    createBox(w, h, d, color) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({ color })
        );
        mesh.castShadow = true;
        mesh.position.y = h / 2; 
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    }
}