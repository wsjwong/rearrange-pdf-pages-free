'use client';

import { FileText, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import PageGrid from "@/components/PageGrid";
import { loadPDF, mergePDFs, PDFPage } from "@/lib/pdf-utils";

export default function Home() {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const newPages: PDFPage[] = [];
      for (const file of files) {
        const filePages = await loadPDF(file);
        newPages.push(...filePages);
      }
      setPages((prev) => [...prev, ...newPages]);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReorder = (newPages: PDFPage[]) => {
    setPages(newPages);
  };

  const handleDelete = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to remove all pages?")) {
      setPages([]);
    }
  };

  const handleDownload = async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    try {
      const pdfBytes = await mergePDFs(pages);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edited-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="container">
      <header style={{
        padding: "2rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            background: "var(--primary)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)"
          }}>
            <FileText color="white" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Rearrange PDF Pages Free</h1>

          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          {pages.length > 0 && (
            <>
              <button
                className="btn btn-destructive"
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                <Trash2 size={18} />
                Clear All
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={isProcessing}
              >
                <Download size={18} />
                {isProcessing ? "Processing..." : "Save PDF"}
              </button>
            </>
          )}
        </div>
      </header>

      {pages.length === 0 ? (
        <div style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "2rem"
        }}>
          <div style={{ maxWidth: "500px", width: "100%" }}>
            <Dropzone onUpload={handleUpload} />
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div style={{ marginBottom: "2rem" }}>
            <Dropzone onUpload={handleUpload} compact />
          </div>

          <div style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
            {pages.length} page{pages.length !== 1 ? 's' : ''} • Drag to reorder
          </div>

          <PageGrid
            pages={pages}
            onReorder={handleReorder}
            onDelete={handleDelete}
          />
        </div>
      )}
    </main>
  );
}
