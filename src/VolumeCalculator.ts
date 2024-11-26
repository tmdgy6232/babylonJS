import { Mesh, Vector3, VertexData } from "@babylonjs/core";

export class VolumeCalculator {
    /**
     * 메시의 특정 높이까지의 체적을 계산
     * @param mesh 대상 메시
     * @param height 계산할 높이 (y축 기준)
     * @param slices 계산 정확도를 위한 슬라이스 수
     * @returns 계산된 체적
     */
    static calculateVolumeUpToHeight(mesh: Mesh, height: number, slices: number = 100): number {
        const positions = mesh.getVerticesData("position");

        const indices = mesh.getIndices();

        if (!positions || !indices) {
            return 0;
        }

        // 메시의 바운딩 박스 계산
        const boundingInfo = mesh.getBoundingInfo();
        const minY = boundingInfo.boundingBox.minimumWorld.y;
        const maxY = Math.min(height, boundingInfo.boundingBox.maximumWorld.y);

        if (height < minY) {
            return 0; // height가 메시의 바닥보다 낮은 경우
        }

        // 슬라이스 높이 계산
        const sliceHeight = (maxY - minY) / slices;
        let totalVolume = 0;

        // 각 슬라이스별 단면적을 계산하여 체적 누적
        for (let i = 0; i < slices; i++) {
            const currentHeight = minY + (i * sliceHeight);
            const nextHeight = currentHeight + sliceHeight;

            // 현재 높이에서의 단면적 계산
            const area1 = this.calculateCrossSectionArea(mesh, currentHeight);
            const area2 = this.calculateCrossSectionArea(mesh, nextHeight);

            // 사다리꼴 공식을 사용하여 슬라이스 체적 계산
            const sliceVolume = (sliceHeight * (area1 + area2)) / 2;
            totalVolume += sliceVolume;
        }

        return totalVolume;
    }

    /**
     * 특정 높이에서의 단면적 계산
     * @param mesh 대상 메시
     * @param height 계산할 높이
     * @returns 단면적
     */
    private static calculateCrossSectionArea(mesh: Mesh, height: number): number {
        const positions = mesh.getVerticesData("position");

        const indices = mesh.getIndices();

        if (!positions || !indices) {
            return 0;
        }

        let intersectionPoints: Vector3[] = [];

        // 모든 삼각형에 대해 반복
        for (let i = 0; i < indices.length; i += 3) {
            const v1 = new Vector3(
                positions[indices[i] * 3],
                positions[indices[i] * 3 + 1],
                positions[indices[i] * 3 + 2]
            );
            const v2 = new Vector3(
                positions[indices[i + 1] * 3],
                positions[indices[i + 1] * 3 + 1],
                positions[indices[i + 1] * 3 + 2]
            );
            const v3 = new Vector3(
                positions[indices[i + 2] * 3],
                positions[indices[i + 2] * 3 + 1],
                positions[indices[i + 2] * 3 + 2]
            );

            // 삼각형과 높이 평면의 교차점 찾기
            this.findIntersectionPoints(v1, v2, v3, height, intersectionPoints);
        }

        // 중복된 점 제거 및 정렬
        intersectionPoints = this.removeDuplicatePoints(intersectionPoints);
        intersectionPoints = this.sortPointsByAngle(intersectionPoints);

        // 교차점들로 다각형 면적 계산
        return this.calculatePolygonArea(intersectionPoints);
    }

    /**
     * 삼각형과 평면의 교차점 찾기
     */
    private static findIntersectionPoints(
        v1: Vector3, 
        v2: Vector3, 
        v3: Vector3, 
        height: number, 
        intersectionPoints: Vector3[]
    ): void {
        const edges = [[v1, v2], [v2, v3], [v3, v1]];

        edges.forEach(([start, end]) => {
            if ((start.y <= height && end.y >= height) || 
                (start.y >= height && end.y <= height)) {
                const t = (height - start.y) / (end.y - start.y);
                const x = start.x + t * (end.x - start.x);
                const z = start.z + t * (end.z - start.z);
                intersectionPoints.push(new Vector3(x, height, z));
            }
        });
    }

    /**
     * 다각형 면적 계산 (신발끈 공식)
     */
    private static calculatePolygonArea(points: Vector3[]): number {
        if (points.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].z;
            area -= points[j].x * points[i].z;
        }

        return Math.abs(area) / 2;
    }

    /**
     * 중복된 교차점 제거
     */
    private static removeDuplicatePoints(points: Vector3[]): Vector3[] {
        const uniquePoints = new Map<string, Vector3>();
        points.forEach((point) => {
            const key = `${point.x.toFixed(6)}:${point.z.toFixed(6)}`;
            uniquePoints.set(key, point);
        });
        return Array.from(uniquePoints.values());
    }

    /**
     * 다각형 점 정렬 (중심점 기준 각도)
     */
    private static sortPointsByAngle(points: Vector3[]): Vector3[] {
        const center = points.reduce((acc, point) => acc.add(point), new Vector3(0, 0, 0)).scale(1 / points.length);
        return points.sort((a, b) => {
            const angleA = Math.atan2(a.z - center.z, a.x - center.x);
            const angleB = Math.atan2(b.z - center.z, b.x - center.x);
            return angleA - angleB;
        });
    }
}
