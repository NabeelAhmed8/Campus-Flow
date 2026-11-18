import jsPDF from "jspdf";

export interface FeeVoucherData {
  invoiceNumber: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  month: string;
  amount: number;
  dueDate: string;
  status: string;
  institution?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export function generateFeeVoucherPDF(data: FeeVoucherData): jsPDF {
  const doc = new jsPDF();
  const isPaid = data.status.toLowerCase() === "paid";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(data.institution || "CampusFlow Academy", 20, 25);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    isPaid ? "Official Cleared Payment Receipt" : "Official Student Fee Voucher & Invoice",
    20,
    32
  );

  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(20, 38, 190, 38);

  // Voucher details
  doc.setFontSize(11);
  doc.setTextColor(40);

  doc.text(`Invoice No: ${data.invoiceNumber}`, 20, 48);
  doc.text(`Billing Month: ${data.month}`, 120, 48);

  doc.text(`Student Name: ${data.studentName}`, 20, 58);
  doc.text(`Roll Number: ${data.rollNumber}`, 120, 58);

  doc.text(`Grade / Class: ${data.grade}`, 20, 68);
  doc.text(`Due Date: ${data.dueDate}`, 120, 68);

  doc.setFont("helvetica", "bold");
  if (isPaid) {
    doc.setTextColor(16, 149, 93);
    doc.text(`Status: PAID (CLEARED)`, 20, 78);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text(`Status: UNPAID (PENDING)`, 20, 78);
  }
  doc.setTextColor(40);
  doc.setFont("helvetica", "normal");

  // Table header
  doc.line(20, 85, 190, 85);
  doc.setFont("helvetica", "bold");
  doc.text("Fee Particulars", 25, 93);
  doc.text("Amount (PKR)", 150, 93);
  doc.line(20, 98, 190, 98);

  // Item
  doc.setFont("helvetica", "normal");
  doc.text(`Tuition & Institutional Fee - ${data.month}`, 25, 108);
  doc.text(`Rs. ${data.amount.toLocaleString()}`, 150, 108);

  // Total
  doc.line(20, 118, 190, 118);
  doc.setFont("helvetica", "bold");
  doc.text("Total Payable:", 110, 126);
  doc.text(`Rs. ${data.amount.toLocaleString()}`, 150, 126);

  // Payment Instruction / Cleared Stamp Box
  doc.setDrawColor(220);
  doc.setFillColor(248, 248, 250);
  doc.rect(20, 138, 170, 45, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  if (isPaid) {
    doc.setTextColor(16, 149, 93);
    doc.text("PAYMENT VERIFICATION DETAILS", 25, 147);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(
      `Payment Method: ${data.paymentMethod || "Pakistani Local Bank Transfer"}`,
      25,
      156
    );
    doc.text(
      `Transaction Ref / Challan No: ${data.transactionRef || "TRX-VERIFIED"}`,
      25,
      165
    );
    doc.text(
      "This document serves as an official cleared tax invoice & payment receipt.",
      25,
      174
    );
  } else {
    doc.setTextColor(30);
    doc.text("PAYABLE VIA PAKISTANI LOCAL BANKS / 1LINK / RAAST", 25, 147);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70);
    doc.text("Bank: Meezan Bank Ltd | HBL (Habib Bank Limited)", 25, 156);
    doc.text(
      "Account Title: CampusFlow Fee Collection | IBAN: PK42MEZN0001020105829101",
      25,
      165
    );
    doc.text(
      "Raast Pay ID: 03001234567 | EasyPaisa / JazzCash Till: 0300-1234567",
      25,
      174
    );
  }

  // Footer notes
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(130);
  doc.text(
    "Please retain this voucher for institutional audit and academic clearance.",
    20,
    196
  );
  doc.text("Generated securely via CampusFlow SaaS Micro-Billing Engine.", 20, 202);

  return doc;
}
