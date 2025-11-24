'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFPage } from '@/lib/pdf-utils';
import dynamic from 'next/dynamic';

const PageThumbnail = dynamic(() => import('./PageThumbnail'), { ssr: false });

interface SortablePageProps {
    page: PDFPage;
    index: number;
    onDelete: (id: string) => void;
}

export default function SortablePage({ page, index, onDelete }: SortablePageProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: page.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PageThumbnail page={page} index={index} onDelete={onDelete} />
        </div>
    );
}
