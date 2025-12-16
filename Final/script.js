let allItems = [];
let filteredItems = [];
let cart = [];
const userId = 1;
let currentPage = 1;
const itemsPerPage = 4;

// Load items from JSON
async function loadItems() {
  try {
    const response = await fetch("inventory/items.json");
    allItems = await response.json();
    filteredItems = [...allItems];
    displayItems(filteredItems);
  } catch (error) {
    console.error("Error loading items:", error);
  }
}

function changeQuantity(itemId, diff) {
  const qtySpan = document.getElementById(`qty-${itemId}`);
  let currentQty = parseInt(qtySpan.textContent, 10);

  currentQty += diff;
  if (currentQty < 1) currentQty = 1;

  qtySpan.textContent = currentQty;
}

// Display items in responsive grid with pagination
function displayItems(items) {
  const inventoryDiv = document.getElementById("inventory");
  inventoryDiv.innerHTML = "";

  const totalPages = Math.floor(items.length / itemsPerPage);

  if (currentPage > totalPages && totalPages > 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = items.slice(startIndex, endIndex);

  itemsToDisplay.forEach((item) => {
    const col = document.createElement("div");
    col.className = "mb-4";

    col.innerHTML = `
            <div class="card h-100">
            <img src="inventory/${item.image}" class="card-img-top" alt="${
      item.name
    }" style="height: 120px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">$${item.price.toFixed(2)}</p>
                    <div class="d-flex align-items-center mb-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${
                          item.id
                        }, -1)">-</button>
                        <span class="mx-2" id="qty-${item.id}">1</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${
                          item.id
                        }, 1)">+</button>
                    </div>
                    <button class="btn btn-primary w-100" onclick="addToCart(${
                      item.id
                    })">Add to Cart</button>
                </div>
            </div>
        `;

    inventoryDiv.appendChild(col);
  });

  // Update pagination controls
  updatePagination(totalPages);
}

// Search function - syntax match on name
function handleSearch() {
  const searchTerm = document.getElementById("searchBar").value.toUpperCase();

  if (searchTerm === "") {
    filteredItems = allItems.map((item) => item);
  } else {
    filteredItems = allItems
      .map((item) =>
        item.name.toUpperCase().includes(searchTerm) ? item : null
      )
      .filter((item) => item !== null);
  }
  displayItems(filteredItems);
}

// Sort function by price
function applySort() {
  const sortValue = document.getElementById("sortSelect").value;

  if (sortValue === "low") {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (sortValue === "high") {
    filteredItems.sort((a, b) => b.price - a.price);
  }
  currentPage = 1;
  displayItems(filteredItems);
}

// Add item to cart
function addToCart(itemId) {
  const item = allItems.find((i) => i.id === itemId);
  if (!item) return;

  const existingItem = cart.find((i) => i.id === itemId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      quantity: 1,
    });
  }

  updateCartCount();
  updateCartModal();
  saveCart();
}

// Update cart count badge
function updateCartCount() {
  const totalItems = cart.length;
  document.getElementById("cartCount").innerHTML = totalItems;
}

// Update cart modal
function updateCartModal() {
  const cartItemsDiv = document.getElementById("cartItems");
  cartItemsDiv.innerHTML = "";

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("cartTotal").textContent = "0.00";
    return;
  }

  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const itemDiv = document.createElement("div");
    itemDiv.className = "d-flex align-items-center mb-3 border-bottom pb-3";
    itemDiv.innerHTML = `
            <img src="inventory/${item.image}" alt="${
      item.name
    }" style="width: 60px; height: 60px; object-fit: cover;" class="me-3">
            <div class="flex-grow-1">
                <h6>${item.name}</h6>
                <p class="mb-0">$${item.price.toFixed(2)}</p>
            </div>
            <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${
                  item.id
                }, -1)">-</button>
                <span class="mx-2">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${
                  item.id
                }, 1)">+</button>
            </div>
        `;
    cartItemsDiv.appendChild(itemDiv);
  });

  document.getElementById("cartTotal").textContent = total.toFixed(2);
}

// Update quantity in cart
function updateCartQuantity(itemId, diff) {
  const item = cart.find((i) => i.id === itemId);
  if (!item) return;

  item.quantity += diff;

  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== itemId);
  }

  updateCartCount();
  updateCartModal();
  saveCart();
}

// Show cart modal
function showCartModal() {
  updateCartModal();
  document.getElementById("cartModal").classList.add("show");
}

// Hide cart modal
function hideCartModal() {
  document.getElementById("cartModal").classList.remove("show");
}

// Event listeners
document.getElementById("searchBar").addEventListener("input", handleSearch);
document.getElementById("sortSelect").addEventListener("change", applySort);

// Cart icon click to open modal
document.getElementById("cartIcon").addEventListener("click", showCartModal);

// Close modal buttons
document.getElementById("closeModal").addEventListener("click", hideCartModal);
document
  .getElementById("closeModalBtn")
  .addEventListener("click", hideCartModal);

// Close modal when clicking outside
document
  .getElementById("cartModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      hideCartModal();
    }
  });

// Update pagination controls
function updatePagination(totalPages) {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  if (totalPages <= 1) {
    return; // Don't show pagination if there's only one page or no items
  }

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${
    currentPage - 1
  }); return false;">Previous</a>`;
  paginationDiv.appendChild(prevLi);

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
    paginationDiv.appendChild(pageLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${
    currentPage + 1
  }); return false;">Next</a>`;
  paginationDiv.appendChild(nextLi);
}

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayItems(filteredItems);
  }
}

// Load cart from server
async function loadCart() {
  try {
    const response = await fetch(`http://localhost:3000/users/items`);
    const items = await response.json();
    cart = items || [];
    updateCartCount();
  } catch (error) {
    console.error("Error loading cart:", error);
    cart = [];
  }
}

// Save cart to server
async function saveCart() {
  try {
    await fetch(`http://localhost:3000/users/cart`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cart),
    });
  } catch (error) {
    console.error("Error saving cart:", error);
  }
}

// Load items and cart on page load
loadItems();
loadCart();
