import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportTableToPdf(el) {
  if (!el) return;

  const imgStackItemOriginalStyles = [];
  const individualImageOriginalStyles = [];
  let prevClassName = '';

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

    prevClassName = el.className;
    el.classList.add('pdf-hex-bg');

    const originalPaddingLeft = el.style.paddingLeft;
    el.style.paddingLeft = '30px';


    const canvas = await html2canvas(el, {
      scale: 2,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      useCORS: true,
      backgroundColor: null,
    });


    el.style.paddingLeft = originalPaddingLeft;

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
    imgStackItemOriginalStyles.forEach(orig => {
      orig.el.style.marginLeft = orig.marginLeft;
      orig.el.style.zIndex = orig.zIndex;
    });
    individualImageOriginalStyles.forEach(orig => {
      orig.el.style.width = orig.width;
      orig.el.style.height = orig.height;
      orig.el.style.objectFit = orig.objectFit;
    });
    if (prevClassName) el.className = prevClassName;
  }
}
