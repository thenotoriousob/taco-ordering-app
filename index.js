import { menuArray } from "./data.js";

const paymentModal = document.getElementById("payment-modal");
const payForm = document.getElementById("payment-form");
const confirmationContainerEl = document.getElementsByClassName("confirmation-container");
const tipEls = document.getElementsByClassName("tips");

let orderedItems = [];
let discounts = [];

let tipPercentage = 0;

document.addEventListener("click", (e) => {
    if (e.target.dataset.addItem) {
        handleAddItemClick(Number(e.target.dataset.addItem));
    }
    else if (e.target.dataset.removeItem) {
        handleRemoveItemClick(Number(e.target.dataset.removeItem));
    }
    else if (e.target.id === "complete-order-btn") {
        handleCompleteOrderClick();
    }
    else if(e.target.classList.value.includes("stars")) {
        handleReviewClick(e.target.id);
    }
    else if(e.target.classList.value.includes("tips")) {

        for (let element of tipEls) {
            e.target.id === element.id ? element.classList.add("tips-selected") : element.classList.remove("tips-selected");
        };

        handleTipClick(e.target.id);
    }
    else if(!e.target.closest('.payment-container') && e.target.id !== "complete-order-btn") {
        paymentModal.style.display = 'none'
    }
});

payForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handlePaymentSubmit();
});

resetForm();

// Create an Order object to store what has been ordered
function Order(id, name, price) {
    this.id = id
    this.name = name
    this.price = price
    this.ordered = 0
    this.incrementOrdered = function() {
        this.ordered++;
    }
    this.decrementOrdered = function() {
      this.ordered--;
  }
}

function Discount(id, name, discount, type, qualifyingAmount) {
    this.id = id
    this.name = name;
    this.discount = discount;
    this.type = type;
    this.qualifyingAmount = qualifyingAmount;
    this.qualified = false;
    this.totalDiscount = 0;
    this.hadQualified = function(hasQualified) {
        this.qualified = hasQualified;
    };
    this.setTotalDiscount = function(totalDiscount) {
      this.totalDiscount = Number(totalDiscount.toFixed(2));
  };
}

function handleAddItemClick(itemId) {

    const orderedItem = orderedItems.filter(item => item.id === itemId)[0];

    orderedItem.incrementOrdered();

    renderOrderedItems();
}

function handleRemoveItemClick(itemId) {

    const orderedItem = orderedItems.filter(item => item.id === itemId)[0];

    orderedItem.decrementOrdered();

    renderOrderedItems();
}

function handleTipClick(tipId) {
    switch (tipId) {
        case "10%":
            tipPercentage = 10;
            break;
        case "15%":
            tipPercentage = 15;
            break;
        case "20%":
            tipPercentage = 20;
            break;
        default:
            tipPercentage = 0;
    }

    renderOrderedItems();
}

function handleCompleteOrderClick() {

    paymentModal.style.display = "inline";
}

function handlePaymentSubmit() {

    const payFormData = new FormData(payForm);
    const name = payFormData.get('name');
    const card = payFormData.get('card');
    const ccv = payFormData.get('ccv');

    paymentModal.style.display = "";

    payForm.reset();

    renderConfirmationMessage(name);
}

function handleReviewClick(stars) {
    // Do something with the review!
    console.log(stars);

    resetForm();
}

function hasQualifiedForDiscount(totalPrice) {
    return discounts.sort((a, b) => a.qualifyingAmount - b.qualifyingAmount).reverse().find(discount => {
        if (totalPrice >= discount.qualifyingAmount) {
            switch (discount.type) {
                case "percent":
                    discount.setTotalDiscount(((totalPrice / 100) * -discount.discount));
                    break;
                case "value":
                    discount.setTotalDiscount(-discount.discount);
                    break;
            }
            return true;
        }
    });
}

function renderOrderedItems() {

    const orderedItemsEl = document.getElementById("ordered-items");
    const orderContainerEl = document.getElementsByClassName("order-container");
    const totalPriceEl = document.getElementById("total-price");
    
    let itemOrdered = false;
    let totalDiscount = 0;

    orderedItemsEl.innerHTML = "";

    orderedItems.forEach(item => {

        orderedItemsEl.innerHTML += item.ordered > 0 ?
        `
        <div class="order-item-card">
            <p class="order-label">${item.name} ${item.ordered > 1 ? `x ${item.ordered}` : ''}</p>
            <button class="remove-order-btn" data-remove-item="${item.id}">remove</button>
            <p class="order-price">$${item.price * item.ordered}</p>
        </div>
        `
        : '';

        if (!itemOrdered && item.ordered > 0) {
            itemOrdered = true;
        };
    });

    if (itemOrdered) {

        const totalPrice = orderedItems.reduce((total, currentItem) => {
            return total + (currentItem.price * currentItem.ordered);
        },0);

        const qualifiedDiscount = hasQualifiedForDiscount(totalPrice);

        if (qualifiedDiscount) {
            orderedItemsEl.innerHTML += 
            `
            <div class="order-item-card">
                <p class="order-label">${qualifiedDiscount.name}</p>
                <p class="order-price">$${qualifiedDiscount.totalDiscount.toFixed(2)}</p>
            </div>
            `;
            totalDiscount = qualifiedDiscount.totalDiscount;
        }

        const tip = ((totalPrice + totalDiscount) / 100) * tipPercentage;

        orderContainerEl[0].style.display = "block";
        totalPriceEl.innerText = `$${(totalPrice + totalDiscount + tip).toFixed(2)}`;
    } else {
        orderContainerEl[0].style.display = "none";
    }

}

function renderFoodItems() {

    const foodItemsEl = document.getElementById("food-items");

    menuArray.forEach(item => {
        foodItemsEl.innerHTML += `
            <div class="item-card" >
                <!-- <img class="item-img" src="./images/pizza.jpg" alt="Pizza slice graphic"> -->
                <p class="item-graphic">${item.emoji}</p>
                <!-- <img class="item-example-image" src="./images/amie-watson-qeVpw7i2Wi0-unsplash.jpg"> -->
                <div class="item-information">
                    <h2 class="item-name">${item.name}</h2>
                    <p class="item-ingredients">${item.ingredients.join(", ")}</p>
                    <p class="item-price">$${item.price}</p>
                </div>
                <button class="item-btn" data-add-item="${item.id}">+</button>
            </div>
            `;
    })

}

function renderConfirmationMessage(name) {

    const orderContainerEl = document.getElementsByClassName("order-container");
    const orderNameEl = document.getElementById("order-name");

    orderContainerEl[0].style.display = "none";
    confirmationContainerEl[0].style.display = "block";
    orderNameEl.innerText = name;
}

function resetForm() {

    orderedItems = [];
    discounts = [];
    tipPercentage = 0;
    /* Create an order object for each item on the menu, we will only display
      those where the number ordered is greater than 1 */
    menuArray.forEach(item => {
        orderedItems.push(new Order (item.id, item.name, item.price));
    })

    discounts.push(new Discount(0, "10% off $30 spend", 10, "percent", 30));
    discounts.push(new Discount(1, "15% off $40 spend", 15, "percent", 40));
    discounts.push(new Discount(2, "$10 off $50 spend", 10, "value", 50));

    confirmationContainerEl[0].style.display = "none";

    for (let element of tipEls) {
        element.classList.remove("tips-selected");
    };
}

renderFoodItems();
