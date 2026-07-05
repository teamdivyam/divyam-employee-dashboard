
/**
 * 
 * @param {*} bytesSize 
 * @returns 
 */

const fileSize = (bytesSize) => {
    const KB = 1024;
    const MB = 1024 * 1024;

    if (bytesSize < MB) {
        // Convert to KB
        const sizeKB = bytesSize / KB;
        return `${sizeKB.toFixed(2)} KB`;
    } else {
        // Convert to MB
        const sizeMB = bytesSize / MB;
        return `${sizeMB.toFixed(2)} MB`;
    }
}

export default fileSize