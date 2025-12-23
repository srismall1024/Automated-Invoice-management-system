import { supabase } from "./supabase.js";

let selectedSellerId = null;
let cart = {};
let products = [];

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".seller-btn").forEach(btn => {
        btn.addEventListener("click", () => selectSeller(btn.dataset.seller));
    });
    const placeBtn = document.getElementById("placeOrderBtn");
    if (placeBtn) placeBtn.addEventListener("click", placeOrder);
});

async function selectSeller(sellerName) {
    cart = {};
    const { data: seller } = await supabase.from("companies").select("id").eq("name", sellerName).single();
    if (!seller) return alert("Seller not found");

    selectedSellerId = seller.id;
    const { data: productData } = await supabase.from("products").select("*").eq("seller_id", seller.id);
    products = productData || [];
    renderProducts();
    document.getElementById("placeOrderBtn").style.display = "block";
}

function renderProducts() {
    const div = document.getElementById("products");
    div.innerHTML = "";
    products.forEach(p => {
        cart[p.id] = 0;
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <h4>${p.name}</h4><p>₹${p.price}</p>
            <div class="quantity-controls">
                <button onclick="window.updateQty(${p.id}, -1)">−</button>
                <span id="q-${p.id}">0</span>
                <button onclick="window.updateQty(${p.id}, 1)">+</button>
            </div>`;
        div.appendChild(card);
    });
}

window.updateQty = (id, delta) => {
    cart[id] = Math.max(0, (cart[id] || 0) + delta);
    document.getElementById(`q-${id}`).innerText = cart[id];
};

async function placeOrder() {
    const user = JSON.parse(localStorage.getItem("user"));
    const { data: buyer } = await supabase.from("companies").select("id").eq("name", user.company).single();
    if (!buyer) return alert("Buyer profile not found");

    let grandTotal = 0;
    const items = [];
    const pdfItems = [];

    products.forEach(p => {
        const qty = cart[p.id] || 0;
        if (qty > 0) {
            // TAX CALCULATION
            const subtotal = p.price * qty;
            const taxRate = p.tax || 0; 
            const taxAmount = (subtotal * taxRate) / 100;
            const totalWithTax = subtotal + taxAmount;

            grandTotal += totalWithTax;

            items.push({ product_id: p.id, quantity: qty, price: p.price });
            pdfItems.push({ 
                name: p.name, 
                quantity: qty, 
                price: p.price, 
                taxRate: taxRate,
                taxAmount: taxAmount.toFixed(2),
                rowTotal: totalWithTax.toFixed(2) 
            });
        }
    });

    if (grandTotal === 0) return alert("No items selected");

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const formattedDate = deliveryDate.toISOString().split('T')[0];

    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const invoiceId = `INV-${2001 + (count || 0)}`;

    localStorage.setItem("tempInvoiceData", JSON.stringify({
        invoiceNo: invoiceId, buyerName: user.company, items: pdfItems, total: grandTotal.toFixed(2)
    }));

    const finalAmount = Math.round(grandTotal);

    const { data: order, error: oErr } = await supabase.from("orders").insert({
        invoice_no: invoiceId, buyer_id: buyer.id, seller_id: selectedSellerId,
        total: finalAmount, status: "PENDING", delivery_date: formattedDate 
    }).select().single();

    if (oErr) return alert("Order Failed: " + oErr.message);

    await supabase.from("order_items").insert(items.map(i => ({ ...i, order_id: order.id })));
    await supabase.from("payments").insert({ order_id: order.id, amount: finalAmount, status: "PENDING" });

    window.location.href = `payment.html?orderId=${order.id}&amount=${finalAmount}`;
}