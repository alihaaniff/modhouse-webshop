const DATA_URL = "data/produkter.json";
const CART_KEY = "modhouse_cart";

// Hämtar produkter
async function getProducts() {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
        throw new Error("Kunde inte läsa produktdata.");
    }

    const data = await response.json();

    return data.produkter;
}

// Kundvagn
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();

    let count = 0;

    cart.forEach(item => {
        count += item.quantity;
    });

    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = count;
    });
}

// GA4
function ga(eventName, params = {}) {
    if (typeof gtag === "function") {
        gtag("event", eventName, params);
    }
}

// Lägg i kundvagn
function addToCart(product) {
    if (!product) {
        return;
    }

    const cart = getCart();

    const existingProduct = cart.find(
        item => item.id === product.id
    );

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            id: product.id,
            quantity: 1
        });
    }

    saveCart(cart);

    ga("add_to_cart", {
        currency: "SEK",
        value: product.pris,
        items: [{
            item_id: product.id,
            item_name: product.namn,
            item_category: product.kategori,
            price: product.pris,
            quantity: 1
        }]
    });

    alert(product.namn + " lades till i kundvagnen.");
}

// Produktsidan
async function initProducts() {
    const grid = document.querySelector(".product-grid");

    if (!grid) {
        return;
    }

    try {
        const products = await getProducts();

        grid.querySelectorAll(".add-to-cart").forEach(button => {
            const productId = button.dataset.id;

            const product = products.find(
                item => item.id === productId
            );

            if (!product) {
                return;
            }

            button.addEventListener("click", () => {
                addToCart(product);
            });

            const card = button.closest(".product-card");

            if (card) {
                card.dataset.category = product.kategori;
            }
        });

        // Produktfilter
        document.querySelectorAll(".filter-btn").forEach(button => {
            button.addEventListener("click", () => {
                document.querySelectorAll(".filter-btn").forEach(btn => {
                    btn.classList.remove("active");
                });

                button.classList.add("active");

                const filter = button.dataset.filter;

                grid.querySelectorAll(".product-card").forEach(card => {
                    const hide =
                        filter !== "Alla" &&
                        card.dataset.category !== filter;

                    card.classList.toggle("hidden", hide);
                });
            });
        });

        // Kategori från URL
        const params = new URLSearchParams(window.location.search);
        const category = params.get("category");

        if (category) {
            let wantedCategory = "";

            if (category === "custom-pc") {
                wantedCategory = "Custom-PC";
            }

            if (category === "moddade-konsoler") {
                wantedCategory = "Moddade konsoler";
            }

            if (category === "custom-tillbehor") {
                wantedCategory = "Custom-tillbehör";
            }

            if (wantedCategory) {
                grid.querySelectorAll(".product-card").forEach(card => {
                    card.classList.toggle(
                        "hidden",
                        card.dataset.category !== wantedCategory
                    );
                });
            }
        }

    } catch (error) {
        console.error(error);
    }
}

// Produktdetaljer
async function initProductDetail() {
    const root = document.querySelector("#product-detail");

    if (!root) {
        return;
    }

    try {
        const products = await getProducts();

        const params = new URLSearchParams(
            window.location.search
        );

        const id = params.get("id");

        const product = products.find(
            item => item.id === id
        );

        if (!product) {
            root.innerHTML = `
                <div class="empty">
                    <h2>Produkten hittades inte</h2>
                    <p class="muted">
                        Produkten kan inte hittas i produktkatalogen.
                    </p>
                    <a class="button" href="produkter.html">
                        Till produkter
                    </a>
                </div>
            `;

            return;
        }

        const availability =
            product.antal_kvar > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock";

        root.innerHTML = `
            <article
                class="product-detail"
                itemscope
                itemtype="https://schema.org/Product"
            >

                <div class="product-detail-image">
                    <img
                        src="${product.bild}"
                        alt="${product.namn}"
                        itemprop="image"
                    >
                </div>

                <div class="product-detail-info">

                    <p class="eyebrow">
                        ${product.kategori}
                    </p>

                    <h1 itemprop="name">
                        ${product.namn}
                    </h1>

                    <p
                        class="muted"
                        itemprop="description"
                    >
                        ${product.beskrivning}
                    </p>

                    <div
                        itemprop="offers"
                        itemscope
                        itemtype="https://schema.org/Offer"
                    >

                        <p class="price">
                            <span itemprop="price">
                                ${product.pris}
                            </span>

                            <span itemprop="priceCurrency">
                                SEK
                            </span>
                        </p>

                        <meta
                            itemprop="availability"
                            content="${availability}"
                        >

                    </div>

                    <p class="stock">
                        ${product.antal_kvar} st i lager
                    </p>

                    <h2>
                        Specifikationer
                    </h2>

                    <ul class="specs">
                        ${Object.entries(product.specifikationer || {})
                            .map(([key, value]) => `
                                <li>
                                    <strong>${key}:</strong>
                                    ${value}
                                </li>
                            `)
                            .join("")}
                    </ul>

                    <button
                        class="button add-detail"
                        type="button"
                    >
                        Lägg i kundvagn
                    </button>

                    <a
                        class="button secondary"
                        href="produkter.html"
                    >
                        ← Till produkter
                    </a>

                </div>

            </article>
        `;

        const addButton = root.querySelector(".add-detail");

        if (addButton) {
            addButton.addEventListener("click", () => {
                addToCart(product);
            });
        }

        ga("view_item", {
            currency: "SEK",
            value: product.pris,
            items: [{
                item_id: product.id,
                item_name: product.namn,
                item_category: product.kategori,
                price: product.pris
            }]
        });

    } catch (error) {
        console.error(error);

        root.innerHTML = `
            <div class="empty">
                <h2>Ett fel uppstod</h2>

                <p class="muted">
                    Kunde inte läsa produktinformationen.
                </p>

                <a class="button" href="produkter.html">
                    Till produkter
                </a>
            </div>
        `;
    }
}

// Kundvagn
async function initCart() {
    const root = document.querySelector("#cart-content");

    if (!root) {
        return;
    }

    try {
        const products = await getProducts();
        let cart = getCart();

        if (!cart.length) {
            root.innerHTML = `
                <div class="empty">
                    <h2>Kundvagnen är tom</h2>

                    <p class="muted">
                        Lägg till en produkt för att fortsätta.
                    </p>

                    <a class="button" href="produkter.html">
                        Se produkter
                    </a>
                </div>
            `;

            return;
        }

        let total = 0;
        let rows = "";

        cart.forEach(item => {
            const product = products.find(
                p => p.id === item.id
            );

            if (!product) {
                return;
            }

            const sum = product.pris * item.quantity;

            total += sum;

            rows += `
                <tr>
                    <td>${product.namn}</td>
                    <td>${item.quantity}</td>
                    <td>${sum} SEK</td>
                    <td>
                        <button
                            type="button"
                            data-remove="${product.id}"
                        >
                            Ta bort
                        </button>
                    </td>
                </tr>
            `;
        });

        root.innerHTML = `
            <table class="cart-table">

                <thead>
                    <tr>
                        <th>Produkt</th>
                        <th>Antal</th>
                        <th>Summa</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

            <p class="cart-total">
                Totalt: ${total} SEK
            </p>

            <a class="button" href="checkout.html">
                Till checkout
            </a>
        `;

        // Ta bort produkt
        root.querySelectorAll("[data-remove]").forEach(button => {
            button.addEventListener("click", () => {
                cart = cart.filter(
                    item => item.id !== button.dataset.remove
                );

                saveCart(cart);
                initCart();
            });
        });

        ga("view_cart", {
            currency: "SEK",
            value: total,
            items: cart.map(item => {
                const product = products.find(
                    p => p.id === item.id
                );

                return {
                    item_id: product.id,
                    item_name: product.namn,
                    price: product.pris,
                    quantity: item.quantity
                };
            })
        });

    } catch (error) {
        console.error(error);
    }
}

// Checkout
async function initCheckout() {
    const summary = document.querySelector("#checkout-summary");

    if (!summary) {
        return;
    }

    try {
        const products = await getProducts();
        const cart = getCart();

        let total = 0;
        let names = [];

        cart.forEach(item => {
            const product = products.find(
                p => p.id === item.id
            );

            if (!product) {
                return;
            }

            total += product.pris * item.quantity;

            names.push(
                product.namn + " × " + item.quantity
            );
        });

        if (cart.length) {
            summary.innerHTML = `
                <strong>Din order:</strong>
                <br>
                ${names.join("<br>")}
                <br><br>
                <strong>Totalt: ${total} SEK</strong>
            `;
        } else {
            summary.innerHTML = `
                Kundvagnen är tom.
                <a href="produkter.html">
                    Välj produkter
                </a>
            `;
        }

        // GA4 checkout
        if (cart.length) {
            ga("begin_checkout", {
                currency: "SEK",
                value: total,
                items: cart.map(item => {
                    const product = products.find(
                        p => p.id === item.id
                    );

                    return {
                        item_id: product.id,
                        item_name: product.namn,
                        price: product.pris,
                        quantity: item.quantity
                    };
                })
            });
        }

        const form = document.querySelector("#checkout-form");

        if (!form) {
            return;
        }

        form.addEventListener("submit", event => {
            event.preventDefault();

            if (!cart.length) {
                return;
            }

            // GA4 köp
            ga("purchase", {
                transaction_id: "ORDER-" + Date.now(),
                currency: "SEK",
                value: total,
                items: cart.map(item => {
                    const product = products.find(
                        p => p.id === item.id
                    );

                    return {
                        item_id: product.id,
                        item_name: product.namn,
                        price: product.pris,
                        quantity: item.quantity
                    };
                })
            });

            localStorage.removeItem(CART_KEY);

            updateCartCount();

            form.reset();

            const result = document.querySelector(
                "#checkout-result"
            );

            if (result) {
                result.innerHTML = `
                    <div class="notice">
                        <strong>
                            Köpet är genomfört!
                        </strong>

                        <p>
                            Tack för din beställning.
                        </p>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error(error);
    }
}

// Startar sidan
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    initProducts();
    initProductDetail();
    initCart();
    initCheckout();
});