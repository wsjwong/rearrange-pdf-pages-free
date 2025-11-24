'use client';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PDFPage } from '@/lib/pdf-utils';
import SortablePage from './SortablePage';

interface PageGridProps {
    pages: PDFPage[];
    onReorder: (newPages: PDFPage[]) => void;
    onDelete: (id: string) => void;
}

export default function PageGrid({ pages, onReorder, onDelete }: PageGridProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = pages.findIndex((p) => p.id === active.id);
            const newIndex = pages.findIndex((p) => p.id === over.id);

            onReorder(arrayMove(pages, oldIndex, newIndex));
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    width: '100%',
                    padding: '1rem 0',
                }}>
                    {pages.map((page, index) => (
                        <SortablePage
                            key={page.id}
                            page={page}
                            index={index}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
