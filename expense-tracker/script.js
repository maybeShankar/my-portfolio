// ================================
// STUDENT BUDGET TRACKER
// ================================

// Get elements from HTML
const form = document.getElementById("transaction-form");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");

const transactionList = document.getElementById("transaction-list");
const categoryList = document.getElementById("category-list");
const transactionCountElement =
  document.getElementById("transaction-count");

const clearAllButton = document.getElementById("clear-all");

// Store transactions here
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// ================================
// ADD TRANSACTION
// ================================

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();

  const amount = Number(amountInput.value);

  const type = typeInput.value;

  const category = categoryInput.value;

  // Create transaction object
  const transaction = {
    id: Date.now(),
    description: description,
    amount: amount,
    type: type,
    category: category,
    date: new Date().toISOString(),
  };

  // Add transaction to array
  transactions.push(transaction);

  // Update the screen
  updateApp();

  // Clear form
  form.reset();
});

// ================================
// CLEAR ALL TRANSACTIONS
// ================================

clearAllButton.addEventListener("click", function () {
  const shouldClear = confirm(
    "Are you sure you want to delete all transactions?",
  );

  if (!shouldClear) {
    return;
  }

  transactions = [];
  updateApp();
});

// ================================
// UPDATE APP
// ================================

function updateApp() {
  updateSummary();

  displayTransactions();

  displayCategories();

  transactionCountElement.textContent = transactions.length;

  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ================================
// DISPLAY CATEGORY TOTALS
// ================================

function displayCategories() {
  const categoryTotals = {};

  transactions.forEach(function (transaction) {
    if (transaction.type === "expense") {
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + transaction.amount;
    }
  });

  categoryList.innerHTML = "";

  const categories = Object.entries(categoryTotals);

  if (categories.length === 0) {
    categoryList.innerHTML = `
      <p class="empty-message">
        Add some expenses to see your spending breakdown.
      </p>
    `;
    return;
  }

  const totalExpenses = categories.reduce(function (total, [, amount]) {
    return total + amount;
  }, 0);

  categories
    .sort(function ([, firstAmount], [, secondAmount]) {
      return secondAmount - firstAmount;
    })
    .forEach(function ([category, amount]) {
      const percentage = Math.min(
        100,
        Math.round((amount / totalExpenses) * 100),
      );
      const item = document.createElement("div");

      item.className = "category-item";
      item.innerHTML = `
        <div class="category-header">
          <span>${category}</span>
          <span>${formatCurrency(amount)}</span>
        </div>
        <div class="category-bar">
          <div class="category-progress" style="width: ${percentage}%; max-width: 100%;"></div>
        </div>
      `;

      categoryList.appendChild(item);
    });
}

// ================================
// CALCULATE BALANCE
// ================================

function updateSummary() {
  let income = 0;

  let expenses = 0;

  transactions.forEach(function (transaction) {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else {
      expenses += transaction.amount;
    }
  });

  const balance = income - expenses;

  incomeElement.textContent = formatCurrency(income);

  expensesElement.textContent = formatCurrency(expenses);

  balanceElement.textContent = formatCurrency(balance);
}

// ================================
// DISPLAY TRANSACTIONS
// ================================

function displayTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.innerHTML = `
            <p class="empty-message">
                No transactions yet.
            </p>
        `;

    return;
  }

  [...transactions]
    .sort(function (a, b) {
      return new Date(b.date || 0) - new Date(a.date || 0);
    })
    .forEach(function (transaction) {
    const item = document.createElement("div");

    item.className = "transaction-item";

    const sign = transaction.type === "income" ? "+" : "-";

    item.innerHTML = `
            <div class="transaction-info">

                <h3>${transaction.description}</h3>

                <p>
                    ${transaction.category}
                    • ${formatDate(transaction.date)}
                </p>

            </div>

            <span class="transaction-amount ${transaction.type}">
                ${sign}${formatCurrency(transaction.amount)}
            </span>

            <button
                class="edit-btn"
                onclick="editTransaction(${transaction.id})"
            >
                ✏️
            </button>

            <button
                class="delete-btn"
                onclick="deleteTransaction(${transaction.id})"
            >
                ✕
            </button>
        `;

    transactionList.appendChild(item);
  });
}

// ================================
// DELETE TRANSACTION
// ================================

function deleteTransaction(id) {
  transactions = transactions.filter(function (transaction) {
    return transaction.id !== id;
  });

  updateApp();
}

// ================================
// EDIT TRANSACTION
// ================================

function editTransaction(id) {
  const transaction = transactions.find(function (item) {
    return item.id === id;
  });

  if (!transaction) {
    return;
  }

  const newDescription = prompt("Edit description:", transaction.description);

  if (newDescription === null) {
    return;
  }

  const newAmount = prompt("Edit amount:", transaction.amount);

  if (newAmount === null) {
    return;
  }

  const amount = Number(newAmount);

  if (!newDescription.trim()) {
    alert("Description cannot be empty.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount greater than ₹0.");
    return;
  }

  transaction.description = newDescription.trim();
  transaction.amount = amount;

  updateApp();
}

// ================================
// CURRENCY FORMAT
// ================================

function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

// ================================
// FORMAT DATE
// ================================

function formatDate(date) {
  if (!date) {
    return "No date";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Render transactions restored from localStorage when the page opens.
updateApp();
