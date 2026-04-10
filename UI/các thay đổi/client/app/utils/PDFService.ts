// @ts-ignore
import html2pdf from 'html2pdf.js';

export const PDFService = {
  exportToPDF: (elementId: string, filename: string = 'SmartTour_Document.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Cấu hình PDF "Cách ly CSS" - Loại bỏ hoàn toàn oklch
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc: Document) => {
          // 1. XÓA TẤT CẢ STYLE CỦA TAILWIND (Nơi chứa oklch ngầm)
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          // 2. NẠP LẠI CSS TỐI GIẢN (CHỈ DÙNG HEX)
          const pureHexStyle = clonedDoc.createElement('style');
          pureHexStyle.innerHTML = `
            body { font-family: Arial, sans-serif; color: #252525; background: #ffffff; }
            h1, h2, h3 { color: #1B4D3E; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; }
            .no-print { display: none !important; }
            /* Cố định các biến màu cơ bản */
            :root {
              --primary: #1B4D3E !important;
              --background: #ffffff !important;
              --foreground: #252525 !important;
            }
          `;
          clonedDoc.head.appendChild(pureHexStyle);

          // 3. QUÉT VÀ THAY THẾ CHUỖI OKLCH TRONG INLINE STYLE (NẾU CÒN)
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style && el.style.cssText.includes('oklch')) {
              el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#252525');
            }
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const h2p = (html2pdf as any).default || html2pdf;
      h2p().set(opt).from(element).save().catch((err: any) => {
        console.error('Lỗi PDF:', err);
      });
    } catch (e) {
      console.error('Lỗi khởi tạo:', e);
    }
  }
};
