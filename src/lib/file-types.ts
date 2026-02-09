const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i;
const PDF_EXTENSION_PATTERN = /\.pdf$/i;

export const INPUT_ACCEPT_ATTRIBUTE = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.bmp',
    '.tif',
    '.tiff',
].join(',');

export function isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || PDF_EXTENSION_PATTERN.test(file.name);
}

export function isSupportedImageFile(file: File): boolean {
    return file.type.startsWith('image/') || IMAGE_EXTENSION_PATTERN.test(file.name);
}

export function isSupportedInputFile(file: File): boolean {
    return isPdfFile(file) || isSupportedImageFile(file);
}
