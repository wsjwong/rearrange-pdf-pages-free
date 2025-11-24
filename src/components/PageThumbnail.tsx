'use client';

import { X, FileText } from 'lucide-react';
import { PDFPage } from '@/lib/pdf-utils';
import { useState } from 'react';

interface PageThumbnailProps {
    page: PDFPage;
    onDelete: (id: string) => void;
    index: number;
}

export default function PageThumbnail({ page, onDelete, index }: PageThumbnailProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                backgroundColor: 'white',
                height: '280px', // Fixed height to ensure visibility
                display: 'flex',
                flexDirection: 'column',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                pointerEvents: 'none',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f4f4f5',
                overflow: 'hidden'
            }}>
                {page.thumbnailUrl ? (
                    <img
                        src={page.thumbnailUrl}
                        alt={`Page ${index + 1}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <FileText size={32} />
                        <span style={{ fontSize: '0.75rem' }}>No Preview</span>
                    </div>
                )}
            </div>

            <div style={{
                padding: '0.75rem',
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 20,
            }}>
                <span style={{ fontWeight: 500 }}>Page {index + 1}</span>
                <span style={{ opacity: 0.7, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {page.file.name}
                </span>
            </div>

            <button
                onPointerDown={(e) => {
                    e.stopPropagation();
                    // Prevent drag start
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(page.id);
                }}
                style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--destructive)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 50, // Ensure it's above everything
                }}
                title="Remove page"
            >
                <X size={16} />
            </button>
        </div>
    );
}
