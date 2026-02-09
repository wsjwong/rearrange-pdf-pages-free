import { PDFDocument, PDFImage } from 'pdf-lib';
import { isPdfFile, isSupportedImageFile } from './file-types';

// Setup worker moved to loadPDF to avoid SSR issues

export interface PageSize {
    width: number;
    height: number;
}

export interface PDFPage {
    id: string;
    file: File;
    pageIndex: number;
    originalPageNumber: number; // 1-based
    width: number;
    height: number;
    pdfUrl: string;
    thumbnailUrl?: string;
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
    const imageUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to decode image: ${file.name}`));
            img.src = imageUrl;
        });

        return image;
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

async function rasterizeImageToPngBytes(file: File): Promise<Uint8Array> {
    const image = await loadImageElement(file);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (width <= 0 || height <= 0) {
        throw new Error(`Invalid image dimensions for ${file.name}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Unable to render image onto canvas');
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
    );

    if (!blob) {
        throw new Error(`Failed to convert image to PNG: ${file.name}`);
    }

    return new Uint8Array(await blob.arrayBuffer());
}

async function convertImageToPDFFile(file: File, targetPageSize?: PageSize): Promise<File> {
    const pdfDoc = await PDFDocument.create();
    let embeddedImage: PDFImage;

    if (file.type === 'image/png') {
        const imageBytes = new Uint8Array(await file.arrayBuffer());
        embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const imageBytes = new Uint8Array(await file.arrayBuffer());
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else {
        const pngBytes = await rasterizeImageToPngBytes(file);
        embeddedImage = await pdfDoc.embedPng(pngBytes);
    }

    let pageWidth: number;
    let pageHeight: number;
    let drawWidth: number;
    let drawHeight: number;
    let x: number;
    let y: number;

    if (targetPageSize) {
        pageWidth = Math.max(1, targetPageSize.width);
        pageHeight = Math.max(1, targetPageSize.height);
        const fitScale = Math.min(
            pageWidth / embeddedImage.width,
            pageHeight / embeddedImage.height
        );

        drawWidth = Math.max(1, embeddedImage.width * fitScale);
        drawHeight = Math.max(1, embeddedImage.height * fitScale);
        x = (pageWidth - drawWidth) / 2;
        y = (pageHeight - drawHeight) / 2;
    } else {
        // Keep pages reasonably sized for PDF viewers while preserving aspect ratio.
        const maxDimension = 2000;
        const scale = Math.min(1, maxDimension / Math.max(embeddedImage.width, embeddedImage.height));
        pageWidth = Math.max(1, embeddedImage.width * scale);
        pageHeight = Math.max(1, embeddedImage.height * scale);
        drawWidth = pageWidth;
        drawHeight = pageHeight;
        x = 0;
        y = 0;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
    });

    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], file.name, {
        type: 'application/pdf',
        lastModified: file.lastModified,
    });
}

async function normalizeInputToPDFFile(file: File, imagePageSize?: PageSize): Promise<File> {
    if (isPdfFile(file)) {
        return file;
    }

    if (isSupportedImageFile(file)) {
        return convertImageToPDFFile(file, imagePageSize);
    }

    throw new Error(`Unsupported file type: ${file.name}`);
}

export async function loadPDF(
    file: File,
    options?: { imagePageSize?: PageSize }
): Promise<PDFPage[]> {
    const pdfFile = await normalizeInputToPDFFile(file, options?.imagePageSize);
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Create a URL for the file to avoid buffer detachment issues with react-pdf
    const pdfUrl = URL.createObjectURL(pdfFile);

    // Generate thumbnails
    const thumbnails: string[] = [];
    try {
        // Dynamically import pdfjs to avoid SSR issues
        const { pdfjs } = await import('react-pdf');
        if (typeof window !== 'undefined') {
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 }); // Thumbnail scale
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });
                await renderTask.promise;

                thumbnails.push(canvas.toDataURL());
            } else {
                thumbnails.push('');
            }
        }
    } catch (error) {
        console.error("Error generating thumbnails:", error);
        // Fallback to empty thumbnails if generation fails
        for (let i = 0; i < pageCount; i++) {
            thumbnails.push('');
        }
    }

    const pages: PDFPage[] = [];
    const fileId = Math.random().toString(36).substring(7);

    for (let i = 0; i < pageCount; i++) {
        const { width, height } = pdfDoc.getPage(i).getSize();
        pages.push({
            id: `${fileId}-${i}`,
            file: pdfFile,
            pageIndex: i,
            originalPageNumber: i + 1,
            width,
            height,
            pdfUrl,
            thumbnailUrl: thumbnails[i] || undefined,
        });
    }

    return pages;
}

export async function mergePDFs(pages: PDFPage[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    // We need to keep track of the order
    // But to optimize, we can load each file once and copy pages
    // However, copying pages from different docs requires keeping them open

    // Let's iterate and load as needed. For better performance with many files, we could cache loaded docs.
    // Given the scope, simple caching is good.

    const loadedDocs = new Map<File, PDFDocument>();

    for (const page of pages) {
        let srcDoc = loadedDocs.get(page.file);
        if (!srcDoc) {
            const arrayBuffer = await page.file.arrayBuffer();
            srcDoc = await PDFDocument.load(arrayBuffer);
            loadedDocs.set(page.file, srcDoc);
        }

        const [copiedPage] = await mergedPdf.copyPages(srcDoc, [page.pageIndex]);
        mergedPdf.addPage(copiedPage);
    }

    return await mergedPdf.save();
}
