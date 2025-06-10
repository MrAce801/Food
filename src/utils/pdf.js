import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportTableToPdf(el) {
  if (!el) return;

  const imgStackItemOriginalStyles = [];
  const individualImageOriginalStyles = [];
  const connectionLineOriginalStyles = [];
  let prevBackground = '';

  try {
    const imgStackContainers = Array.from(el.querySelectorAll('.img-stack-container'));
    imgStackContainers.forEach(stackContainer => {
      const childrenItems = Array.from(stackContainer.children).filter(child => child.classList.contains('img-stack-item'));
      childrenItems.forEach((item, index) => {
        imgStackItemOriginalStyles.push({ el: item, marginLeft: item.style.marginLeft, zIndex: item.style.zIndex });
        item.style.marginLeft = index > 0 ? '4px' : '0px';
        item.style.zIndex = 'auto';
      });
    });

    const allImagesInTable = Array.from(el.querySelectorAll('#fd-table img'));
    allImagesInTable.forEach(img => {
      individualImageOriginalStyles.push({ el: img, width: img.style.width, height: img.style.height, objectFit: img.style.objectFit });
      img.style.width = '120px';
      img.style.height = '120px';
      img.style.objectFit = 'contain';
    });

    const connectionLines = Array.from(el.querySelectorAll('.connection-line'));
    const linePadding = 40;
    connectionLines.forEach(line => {
      connectionLineOriginalStyles.push({
        el: line,
        width: line.style.width,
        transform: line.style.transform,
      });
      const width = line.offsetWidth || 20;
      line.style.width = `${width + linePadding * 2}px`;
      line.style.transform = `translateX(-${linePadding}px)`;
    });


    prevBackground = el.style.backgroundColor;
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    el.style.backgroundColor = bodyBg;
    // Capture a bit more area on each side
    const extra = 40;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: bodyBg,
      width: el.scrollWidth + extra * 2,
      x: -extra,
    });

    const pdf = new jsPDF({
      unit: 'px',
      format: [canvas.width, canvas.height],
      orientation: 'portrait',
    });
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('FoodDiary.pdf');
    el.style.backgroundColor = prevBackground;
    return true;
  } catch (error) {
    console.error('Fehler beim Erstellen des PDFs:', error);
    return false;
  } finally {
    imgStackItemOriginalStyles.forEach(orig => {
      orig.el.style.marginLeft = orig.marginLeft;
      orig.el.style.zIndex = orig.zIndex;
    });
    individualImageOriginalStyles.forEach(orig => {
      orig.el.style.width = orig.width;
      orig.el.style.height = orig.height;
      orig.el.style.objectFit = orig.objectFit;
    });
    connectionLineOriginalStyles.forEach(orig => {
      orig.el.style.width = orig.width;
      orig.el.style.transform = orig.transform;
    });
    if (prevBackground) el.style.backgroundColor = prevBackground;
  }
}
