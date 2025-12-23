const users = [
  { email:'buyer@abc.com', password:'1234', role:'BUYER', company:'ABC Pvt Ltd' },
  { email:'buyer@xyz.com', password:'1234', role:'BUYER', company:'XYZ Industries' }, 
  { email:'seller@electronics.com', password:'1234', role:'SELLER', company:'ElectroHub' },
  { email:'seller@furniture.com', password:'1234', role:'SELLER', company:'FurniWorld' }
];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert("Invalid credentials");

  localStorage.setItem("user", JSON.stringify(user));

  if (user.role === "BUYER") location.href = "buyer-dashboard.html";
  if (user.role === "SELLER") location.href = "seller-dashboard.html";
}