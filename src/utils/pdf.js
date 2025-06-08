import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportTableToPdf(el) {
  if (!el) return;

  const imgStackItemOriginalStyles = [];
  const individualImageOriginalStyles = [];
  const entryOverflowOriginals = [];
  let prevClassName = '';
  let wrapper = null;

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

    // Temporarily allow entry boxes to overflow so connection lines aren't clipped
    const entryBoxes = Array.from(el.querySelectorAll('[id^="entry-card-"]'));
    entryBoxes.forEach(box => {
      entryOverflowOriginals.push({ el: box, overflow: box.style.overflow });
      box.style.overflow = 'visible';
    });

    // Wrap table to include extra room for connection lines
    wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.paddingLeft = '20px';
    wrapper.style.marginLeft = '-20px'; // extend bounding box to the left
    wrapper.style.overflow = 'visible';
    wrapper.classList.add('pdf-hex-bg');
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      windowWidth: wrapper.scrollWidth,
      windowHeight: wrapper.scrollHeight,
      useCORS: true,
      backgroundColor: null,
    });

    el.className = prevClassName;
    wrapper.parentNode.insertBefore(el, wrapper);
    wrapper.remove();
    wrapper = null;

    // --- FIX FOR OVERFLOW --- convert canvas to image and fit it on an A4 PDF
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const imgWidth = canvasWidth * ratio;
    const imgHeight = canvasHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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
    entryOverflowOriginals.forEach(orig => {
      orig.el.style.overflow = orig.overflow;
    });
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(el, wrapper);
      wrapper.remove();
    }
    if (prevClassName) el.className = prevClassName;
  }
}
