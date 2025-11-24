import { PDFDocument } from 'pdf-lib';

// Setup worker moved to loadPDF to avoid SSR issues

export interface PDFPage {
    id: string;
    file: File;
    pageIndex: number;
    originalPageNumber: number; // 1-based
    pdfUrl: string;
    thumbnailUrl?: string;
}

export async function loadPDF(file: File): Promise<PDFPage[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Create a URL for the file to avoid buffer detachment issues with react-pdf
    const pdfUrl = URL.createObjectURL(file);

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

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                } as any).promise;

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
        pages.push({
            id: `${fileId}-${i}`,
            file,
            pageIndex: i,
            originalPageNumber: i + 1,
            pdfUrl,
            thumbnailUrl: thumbnails[i] || undefined,
        });
    }

    return pages;
}

export async function mergePDFs(pages: PDFPage[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    // Group pages by file to minimize loading
    const fileMap = new Map<File, number[]>();

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
