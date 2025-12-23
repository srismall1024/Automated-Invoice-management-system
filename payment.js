// payment.js
const supabaseUrl = "https://vsybixkkveuefyazaxqk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeWJpeGtrdmV1ZWZ5YXpheHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODE0MDksImV4cCI6MjA4MTI1NzQwOX0.dIZGnXulJhMN96ffow8ELWgzlx_XzbisdeqBd86W0EI";

// Safety check for duplicate declaration
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");
let amountFromUrl = params.get("amount");

document.addEventListener("DOMContentLoaded", () => {
    const amountDisplay = document.getElementById("amountDisplay");
    
    if (!amountFromUrl || amountFromUrl === "0") {
        const localData = JSON.parse(localStorage.getItem("tempInvoiceData"));
        if (localData) amountFromUrl = localData.total;
    }

    if (amountDisplay) amountDisplay.innerText = "₹" + (amountFromUrl || 0);
    
    const payBtn = document.getElementById("payBtn");
    if (payBtn) payBtn.addEventListener("click", processPayment);
});

async function processPayment() {
    const btn = document.getElementById("payBtn");
    const msg = document.getElementById("statusMsg");

    if (!orderId) return alert("Order ID missing!");
    
    btn.disabled = true;
    btn.innerText = "Processing...";
    msg.innerText = "Updating transaction status...";

    try {
        const numericOrderId = Number(orderId);

        const { error: oErr } = await window.supabaseClient
            .from("orders")
            .update({ status: "PAID" })
            .eq("id", numericOrderId);

        const { error: pErr } = await window.supabaseClient
            .from("payments")
            .update({ status: "PAID" })
            .eq("order_id", numericOrderId);

        if (oErr || pErr) throw new Error("Database update failed");

        msg.innerText = "Payment Successful! Downloading Invoice...";
        generateInvoicePDF();

        setTimeout(() => { window.location.href = "buyer-dashboard.html"; }, 3000);

    } catch (error) {
        alert("Payment failed: " + error.message);
        btn.disabled = false;
        btn.innerText = "Pay Now";
        msg.innerText = "";
    }
}

function generateInvoicePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = JSON.parse(localStorage.getItem("tempInvoiceData"));
    
    if (!data) return;

    doc.setFontSize(20);
    doc.text("TAX INVOICE", 105, 20, null, null, "center");
    
    doc.setFontSize(10);
    doc.text(`Invoice No: ${data.invoiceNo}`, 20, 40);
    doc.text(`Buyer: ${data.buyerName}`, 20, 48);

    doc.autoTable({
        head: [["Item", "Qty", "Price", "Tax %", "Tax Amt", "Total"]],
        body: data.items.map(i => [
            i.name, i.quantity, `₹${i.price}`, `${i.taxRate}%`, `₹${i.taxAmount}`, `₹${i.rowTotal}`
        ]),
        startY: 60,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.text(`Grand Total (Incl. Tax): ₹${data.total}`, 20, finalY + 15);
    doc.save(`Invoice_${data.invoiceNo}.pdf`);
    localStorage.removeItem("tempInvoiceData");
}