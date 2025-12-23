import { supabase } from "./supabase.js";

async function loadMonthlyReport() {
    const chartDiv = document.getElementById("chart-container"); // Change ID in HTML
    
    const { data, error } = await supabase
        .from("orders")
        .select("created_at, total")
        .eq("status", "PAID");

    if (error) {
        console.error(error);
        return;
    }

    const monthlyTotals = {};
    data.forEach(o => {
        const month = new Date(o.created_at).toLocaleString("default", { month: "short", year: "numeric" });
        monthlyTotals[month] = (monthlyTotals[month] || 0) + o.total;
    });

    chartDiv.innerHTML = ""; // Clear loader

    Object.entries(monthlyTotals).forEach(([month, amount]) => {
        const barWidth = Math.min(amount / 200, 400); // Scale width
        chartDiv.innerHTML += `
            <div style="margin-bottom: 15px;">
                <span style="display:inline-block; width:100px;">${month}</span>
                <div style="display:inline-block; width:${barWidth}px; background:#4caf50; color:white; padding:5px; border-radius:4px; font-size:12px;">
                    ₹${amount}
                </div>
            </div>
        `;
    });
}

document.addEventListener("DOMContentLoaded", loadMonthlyReport);