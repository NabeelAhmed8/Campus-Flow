import jsPDF from "jspdf";

export interface VoucherBankAccount {
  bankName: string;
  accountTitle: string;
  accountNo: string;
  iban?: string;
}

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
  bankAccounts?: VoucherBankAccount[];
}

export function generateFeeVoucherPDF(data: FeeVoucherData): jsPDF {
  const doc = new jsPDF();
  const statusLower = data.status.toLowerCase();
  const isPaid = statusLower === "paid";
  const isVerifying = statusLower === "pending_verification";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(data.institution || "CampusFlow Institution", 20, 25);
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
    doc.text("Status: PAID (CLEARED)", 20, 78);
  } else if (isVerifying) {
    doc.setTextColor(2, 132, 199);
    doc.text("Status: PENDING ADMIN VERIFICATION", 20, 78);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text("Status: UNPAID (PENDING)", 20, 78);
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
  doc.text(`Rs. ${Number(data.amount || 0).toLocaleString()}`, 150, 108);

  // Total
  doc.line(20, 118, 190, 118);
  doc.setFont("helvetica", "bold");
  doc.text("Total Payable:", 110, 126);
  doc.text(`Rs. ${Number(data.amount || 0).toLocaleString()}`, 150, 126);

  // Payment Instruction / Cleared Stamp Box
  doc.setDrawColor(220);
  doc.setFillColor(248, 248, 250);
  doc.rect(20, 138, 170, 48, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  if (isPaid) {
    doc.setTextColor(16, 149, 93);
    doc.text("PAYMENT VERIFICATION DETAILS", 25, 147);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(
      `Payment Method: ${data.paymentMethod || "Official Campus Payment"}`,
      25,
      156
    );
    doc.text(
      `Transaction Ref / Challan No: ${data.transactionRef || "Counter Receipt"}`,
      25,
      165
    );
    doc.text(
      "This document serves as an official cleared payment receipt.",
      25,
      174
    );
  } else {
    doc.setTextColor(30);
    doc.text("OFFICIAL INSTITUTIONAL PAYMENT CHANNELS", 25, 147);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70);

    const accounts = Array.isArray(data.bankAccounts) ? data.bankAccounts.slice(0, 3) : [];
    if (accounts.length > 0) {
      accounts.forEach((acc, idx) => {
        const y = 156 + idx * 9;
        const ibanPart = acc.iban ? ` | IBAN: ${acc.iban}` : "";
        doc.text(
          `${acc.bankName} — ${acc.accountTitle} | A/C: ${acc.accountNo}${ibanPart}`,
          25,
          y,
          { maxWidth: 160 }
        );
      });
    } else {
      doc.text(
        "Please pay via your school's official bank account or accounts counter and submit the",
        25,
        158
      );
      doc.text(
        "deposit slip / transaction reference ID in the Parent Portal for verification.",
        25,
        166
      );
    }
  }

  // Footer notes
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(130);
  doc.text(
    "Please retain this voucher for institutional audit and academic clearance.",
    20,
    198
  );
  doc.text("Generated via CampusFlow Institutional Billing.", 20, 204);

  return doc;
}
