import { menuArray } from "./data.js";

const paymentModal = document.getElementById("payment-modal");
const payForm = document.getElementById("payment-form");
const confirmationContainerEl = document.getElementsByClassName("confirmation-container");
const tipEls = document.getElementsByClassName("tips");
const orderedItems = [];
const discounts = [];

let selectedTip = 0;

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
    else if(e.target.dataset.review) {
        handleReviewClick(e.target.dataset.review);
    }
    else if(e.target.classList.value.includes("tips")) {
        handleTipClick(e.target.dataset.tip);
    }
    else if(!e.target.closest('.payment-container') && e.target.id !== "complete-order-btn") {
        paymentModal.style.display = 'none'
    }
});

payForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handlePaymentSubmit();
});

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

function Discount(id, name, discount, type, qualifyingTotal) {
    this.id = id
    this.name = name;
    this.discount = discount;
    this.type = type;
    this.qualifyingTotal = qualifyingTotal; // What is the total before order qualifies for discount
    this.totalDiscount = 0;
    this.setTotalDiscount = function(totalDiscount) {
      this.totalDiscount = totalDiscount; // Seemed to treat it as a string without this
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

function handleTipClick(tipPercentage) {

    // Change the background so that it is clear the tip is selected (I previously used the focus or active but that disappeared when clicking away)
    for (let element of tipEls) {
        tipPercentage === element.dataset.tip ? element.classList.add("tips-selected") : element.classList.remove("tips-selected");
    };

    /* Set it to  global variable so we don't need to keep checking which tip was selected
      if the user changes the order */
    selectedTip = tipPercentage;

    renderOrderedItems();
}

function handleCompleteOrderClick() {
    paymentModal.style.display = "block";
}

function handlePaymentSubmit() {

    const payFormData = new FormData(payForm);
    const name = payFormData.get('name');
    const card = payFormData.get('card');
    const ccv = payFormData.get('ccv');

    paymentModal.style.display = "";

    console.log(`The following details have been sent to WorldPay, name: ${name}, card: ${card}, ccv: ${ccv}`);

    payForm.reset();

    renderConfirmationMessage(name);
}

function handleReviewClick(stars) {

    console.log(`A ${stars} star review has been sent to TrustPilot`);

    initialiseForm();
}

function hasQualifiedForDiscount(totalPrice) {

    /* The discounts have been sorted in descending order by the qualifying total so that the highest
       discount the order qualifies for is found first */
    return discounts.sort((a, b) => a.qualifyingTotal - b.qualifyingTotal).reverse().find(discount => {
        if (totalPrice >= discount.qualifyingTotal) {
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
            <button class="btn remove-order-btn" data-remove-item="${item.id}">remove</button>
            <p class="order-price">$${item.price * item.ordered}</p>
        </div>
        `
        : '';

        if (!itemOrdered && item.ordered > 0) {
            itemOrdered = true;
        };
    });

    /* If nothing remains on the order then hide the order form */
    if (!itemOrdered) {
          orderContainerEl[0].style.display = "none";        
    } else {
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

      const tip = ((totalPrice + totalDiscount) / 100) * selectedTip;

      orderContainerEl[0].style.display = "block";
      totalPriceEl.innerText = `$${(totalPrice + totalDiscount + tip).toFixed(2)}`;
    }

}

function renderMenuItems() {

    const foodItemsEl = document.getElementById("food-items");

    menuArray.forEach(item => {
        foodItemsEl.innerHTML += `
            <div class="item-card" >
                <p class="item-graphic">${item.emoji}</p>
                <div class="item-details">
                    <h2 class="item-name">${item.name}</h2>
                    <p class="item-ingredients">${item.ingredients.join(", ")}</p>
                    <p class="item-price">$${item.price}</p>
                </div>
                <button class="btn add-item-btn" data-add-item="${item.id}"><span class="add-item-icon">+</span></button>
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

function initialiseForm() {

    orderedItems.length = 0;
    discounts.length = 0;
    selectedTip = 0;
    /* Create an order object for each item on the menu, we will only display
      those where the number ordered is greater than 1 */
    menuArray.forEach(item => {
        orderedItems.push(new Order (item.id, item.name, item.price));
    })

    /* On a previous project I changed the data.js and was told to try and find other solutions
       in case the data is coming from an api */    
    discounts.push(new Discount(0, "10% off $30 spend", 10, "percent", 30));
    discounts.push(new Discount(1, "15% off $40 spend", 15, "percent", 40));
    discounts.push(new Discount(2, "$10 off $50 spend", 10, "value", 50));

    confirmationContainerEl[0].style.display = "none";

    for (let element of tipEls) {
        element.classList.remove("tips-selected");
    };
}

initialiseForm();

renderMenuItems();
