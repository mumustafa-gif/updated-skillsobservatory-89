import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadChartAsPDF = async (chartElement: HTMLElement, chartTitle: string = 'Chart') => {
  try {
    // Create canvas from the chart element
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      width: chartElement.offsetWidth,
      height: chartElement.offsetHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    // Calculate dimensions to fit the page while maintaining aspect ratio
    const imgWidth = 280; // A4 landscape width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(chartTitle, 15, 15);
    
    // Add chart image
    const yOffset = 25;
    if (imgHeight > 180) {
      // If image is too tall, scale it down
      const scaledHeight = 180;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      pdf.addImage(imgData, 'PNG', 15, yOffset, scaledWidth, scaledHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 15, yOffset, imgWidth, imgHeight);
    }
    
    // Add timestamp
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, pdf.internal.pageSize.height - 10);
    
    // Download the PDF
    const fileName = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const downloadFullReportAsPDF = async (
  reportElement: HTMLElement,
  reportTitle: string = 'Full Report'
) => {
  try {
    // Create canvas from the report element
    const canvas = await html2canvas(reportElement, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      width: reportElement.scrollWidth,
      height: reportElement.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 15;
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportTitle, pageWidth / 2, 40, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('UAE Workforce Skills Analysis Report', pageWidth / 2, 60, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 80, { align: 'center' });
    
    // Add new page for content
    pdf.addPage();
    
    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / (pageHeight - 2 * margin));
    
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const yPosition = -(i * (pageHeight - 2 * margin));
      pdf.addImage(imgData, 'PNG', margin, margin + yPosition, imgWidth, imgHeight);
      
      // Add page number
      pdf.setFontSize(8);
      pdf.text(`Page ${i + 2} of ${totalPages + 1}`, pageWidth - margin - 20, pageHeight - 5);
    }
    
    // Download the PDF
    const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_full_report.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating full report PDF:', error);
    throw new Error('Failed to generate full report PDF. Please try again.');
  }
};