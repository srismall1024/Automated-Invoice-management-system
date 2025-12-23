import { supabase } from "./supabase.js";

// 1. INITIALIZE AND SESSION CHECK
const user = JSON.parse(localStorage.getItem("user"));
const dashboard = document.getElementById("dashboard-content");
const warning = document.getElementById("login-warning");

/**
 * Validates user session and role before loading data
 */
if (!user || user.role !== "SELLER" || !user.company) {
    if (warning) warning.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
} else {
    if (warning) warning.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    
    const userInfoElem = document.getElementById("user-info");
    if (userInfoElem) userInfoElem.innerText = `Logged in as: ${user.company}`;
    
    loadOrders(); // Initial data fetch
}

/**
 * Main function to fetch seller ID and corresponding orders
 */
async function loadOrders() {
    console.log("Fetching data for seller:", user.company);

    // A. Identify the Seller ID from the companies table
    const { data: sellerData, error: sellerError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", user.company)
        .eq("role", "SELLER")
        .single();

    if (sellerError || !sellerData) {
        console.error("Seller fetch error:", sellerError);
        alert("Error: Could not retrieve seller account details.");
        return;
    }

    // B. Fetch all orders assigned to this seller
    const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sellerData.id)
        .order('id', { ascending: false }); // Show newest orders at the top

    if (orderError) {
        console.error("Orders fetch error:", orderError);
        return;
    }

    renderTable(orders);
}

/**
 * Dynamically renders the orders table and updates dashboard statistics
 * @param {Array} orders - List of order objects from Supabase
 */
function renderTable(orders) {
    const tbody = document.getElementById("table-body");
    const totalOrdersElem = document.getElementById("totalOrders");
    const totalRevElem = document.getElementById("totalRevenue");
    const pendingAmtElem = document.getElementById("pendingAmount");

    if (!tbody) return;

    tbody.innerHTML = ""; // Clear existing table content
    let totalRev = 0;
    let totalPending = 0;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 20px;'>No orders found.</td></tr>";
        if (totalOrdersElem) totalOrdersElem.innerText = "0";
        if (totalRevElem) totalRevElem.innerText = "0";
        if (pendingAmtElem) pendingAmtElem.innerText = "0";
        return;
    }

    orders.forEach(order => {
        // Update Running Statistics
        totalRev += order.total;
        if (order.status === "PENDING") {
            totalPending += order.total;
        }

        // Visual Status Indicators
        const statusColor = order.status === "PAID" ? "green" : "#d9534f";

        // Construct Table Row
        const row = `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${order.invoice_no}</td>
                <td style="padding: 10px;">#${order.buyer_id}</td>
                <td style="padding: 10px;">${order.delivery_date || 'Not Set'}</td>
                <td style="padding: 10px;">₹${order.total}</td>
                <td style="padding: 10px; font-weight: bold; color: ${statusColor};">
                    ${order.status}
                </td>
                <td style="padding: 10px;">
                    <select onchange="window.updateOrderStatus(${order.id}, this.value)" style="padding: 5px; cursor: pointer;">
                        <option value="PENDING" ${order.status === "PENDING" ? "selected" : ""}>Pending</option>
                        <option value="PAID" ${order.status === "PAID" ? "selected" : ""}>Paid</option>
                    </select>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Update Dashboard UI Stats
    if (totalOrdersElem) totalOrdersElem.innerText = orders.length;
    if (totalRevElem) totalRevElem.innerText = totalRev.toLocaleString();
    if (pendingAmtElem) pendingAmtElem.innerText = totalPending.toLocaleString();
}

/**
 * Updates the order status in Supabase and refreshes the view
 * Attached to 'window' to be accessible by the onchange attribute in the HTML
 */
window.updateOrderStatus = async function(orderId, newStatus) {
    const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

    if (error) {
        alert("Failed to update status. Check your connection.");
        console.error("Update error:", error);
    } else {
        // Re-load data to ensure UI reflects the database state
        loadOrders();
    }
};