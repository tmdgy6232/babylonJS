import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";
import { VolumeCalculator } from './VolumeCalculator';

class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    constructor() {
        // 기본 설정
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // 카메라 설정
        const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);

        // 조명 설정
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // 호리병 메시 생성 (예시)
        const points = [
            new Vector3(0, 0, 0),
            new Vector3(2, 1, 0),
            new Vector3(1, 2, 0),
            new Vector3(0.5, 3, 0),
            new Vector3(0.8, 4, 0),
            new Vector3(0.3, 5, 0)
        ];
        
        const bottle = MeshBuilder.CreateLathe("bottle", {
            shape: points,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);

        // 특정 높이까지의 체적 계산 및 디버깅
        const heightToCalculate = 2; // 3 단위 높이까지의 체적
        const volume = VolumeCalculator.calculateVolumeUpToHeight(bottle, heightToCalculate);
        
        // 디버깅을 위한 로그 추가
        console.log('Bottle mesh details:');
        console.log('Bounding box:', bottle.getBoundingInfo().boundingBox);
        console.log('Vertices:', bottle.getVerticesData('position'));
        console.log('Indices:', bottle.getIndices());
        
        // 체적 계산 결과
        console.log(`Volume up to height ${heightToCalculate}: ${volume}`);
        if (isNaN(volume)) {
            console.warn('Volume calculation resulted in NaN. Possible issues:');
            console.warn('- Mesh may not be properly initialized');
            console.warn('- Height may be outside mesh bounds');
            console.warn('- Intersection points may not be found');
        }

        // 렌더 루프
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

// 실행
new Game(); 