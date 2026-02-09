'use client';

import { Upload, FilePlus } from 'lucide-react';
import { useState, useRef } from 'react';
import { INPUT_ACCEPT_ATTRIBUTE, isSupportedInputFile } from '@/lib/file-types';

interface DropzoneProps {
    onUpload: (files: File[]) => void;
    compact?: boolean;
}

export default function Dropzone({ onUpload, compact = false }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const supportedFiles = Array.from(e.dataTransfer.files).filter(
                isSupportedInputFile
            );
            if (supportedFiles.length > 0) {
                onUpload(supportedFiles);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const supportedFiles = Array.from(e.target.files).filter(
                isSupportedInputFile
            );
            if (supportedFiles.length > 0) {
                onUpload(supportedFiles);
            }
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: compact ? '1rem' : '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: compact ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                width: '100%',
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={INPUT_ACCEPT_ATTRIBUTE}
                multiple
                style={{ display: 'none' }}
            />

            <div style={{
                width: compact ? '32px' : '64px',
                height: compact ? '32px' : '64px',
                background: 'var(--surface-hover)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
            }}>
                {compact ? <FilePlus size={18} /> : <Upload size={32} />}
            </div>

            <div style={{ textAlign: compact ? 'left' : 'center' }}>
                <p style={{ fontWeight: 600, fontSize: compact ? '0.875rem' : '1.125rem' }}>
                    {compact ? 'Add more files' : 'Drop your PDF or image here'}
                </p>
                {!compact && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        or click to browse
                    </p>
                )}
            </div>
        </div>
    );
}
