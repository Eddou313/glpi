export function UseImages() {
    function cleanImageMap(images: Map<string, { blob: Blob; fileName: string }>) {
        const result = new Map();
        for (const [key, value] of images) {
            if (key.startsWith("._")) {
                continue;
            }
            result.set(
                key.toLowerCase().trim(),
                value
            );
        }
        return result;
    }
    return { cleanImageMap };
}
