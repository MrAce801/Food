import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportTableToPdf(el) {
  if (!el) return;

  let prevClassName = '';

  try {


    prevClassName = el.className;
    el.classList.add('pdf-hex-bg');

    const canvas = await html2canvas(el, {
      scale: 1,
      useCORS: true,
      backgroundColor: null,
    });

    el.className = prevClassName;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('FoodDiary.pdf');
    return true;
  } catch (error) {
    console.error('Fehler beim Erstellen des PDFs:', error);
    return false;
  } finally {
    if (prevClassName) el.className = prevClassName;
  }
}
