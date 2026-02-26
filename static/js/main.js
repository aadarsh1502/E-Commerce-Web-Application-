// ============================================================
// SECTION 1: CSRF TOKEN UTILITY
// ============================================================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const CSRF_TOKEN = getCookie('csrftoken');


// ============================================================
// SECTION 2: TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        info: 'bg-primary',
        warning: 'bg-warning text-dark',
    }[type] || 'bg-success';

    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
    }[type] || 'fa-check-circle';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${icon} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);

    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
    }, 3500);
}


// ============================================================
// SECTION 3: ADD TO CART (AJAX)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.add-to-cart-form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            btn.classList.add('btn-loading');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Adding...';

            fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: new FormData(form),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message, 'success');
                        // Update cart badge
                        let badge = document.getElementById('cart-badge');
                        if (badge) {
                            badge.textContent = data.cart_count;
                        } else if (data.cart_count > 0) {
                            const cartLink = document.querySelector('a[href*="/cart/"]');
                            if (cartLink) {
                                badge = document.createElement('span');
                                badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary';
                                badge.id = 'cart-badge';
                                badge.textContent = data.cart_count;
                                cartLink.classList.add('position-relative');
                                cartLink.appendChild(badge);
                            }
                        }
                    } else {
                        showToast(data.message || 'Could not add to cart', 'error');
                    }
                })
                .catch(() => {
                    showToast('Something went wrong. Please try again.', 'error');
                })
                .finally(() => {
                    btn.classList.remove('btn-loading');
                    btn.innerHTML = originalHTML;
                });
        });
    });


    // ============================================================
    // SECTION 4 & 5: CART QUANTITY +/- BUTTONS & AJAX UPDATE
    // ============================================================
    let updateTimeout = null;

    document.querySelectorAll('.cart-qty-decrease').forEach(btn => {
        btn.addEventListener('click', function () {
            const itemId = this.dataset.itemId;
            const input = document.querySelector(`.cart-qty-input[data-item-id="${itemId}"]`);
            let val = parseInt(input.value) || 1;
            if (val > 1) {
                input.value = val - 1;
                triggerCartUpdate(input);
            }
        });
    });

    document.querySelectorAll('.cart-qty-increase').forEach(btn => {
        btn.addEventListener('click', function () {
            const itemId = this.dataset.itemId;
            const input = document.querySelector(`.cart-qty-input[data-item-id="${itemId}"]`);
            let val = parseInt(input.value) || 1;
            const max = parseInt(this.dataset.max) || 99;
            if (val < max) {
                input.value = val + 1;
                triggerCartUpdate(input);
            }
        });
    });

    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.addEventListener('change', function () {
            triggerCartUpdate(this);
        });
    });

    function triggerCartUpdate(input) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            const url = input.dataset.updateUrl;
            const quantity = parseInt(input.value);
            const itemId = input.dataset.itemId;

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `quantity=${quantity}`,
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        if (data.action === 'removed') {
                            const itemRow = document.getElementById(`cart-item-${itemId}`);
                            if (itemRow) itemRow.remove();
                            showToast('Item removed from cart', 'info');
                        } else {
                            const subtotals = document.querySelectorAll(`.subtotal-${itemId}`);
                            subtotals.forEach(el => {
                                el.textContent = `₹${data.subtotal}`;
                            });
                        }
                        // Update cart total
                        document.querySelectorAll('.cart-total').forEach(el => {
                            el.textContent = `₹${data.cart_total}`;
                        });
                        // Update badge
                        const badge = document.getElementById('cart-badge');
                        if (badge) badge.textContent = data.cart_count;
                    } else {
                        showToast(data.message || 'Update failed', 'error');
                    }
                })
                .catch(() => {
                    showToast('Could not update cart', 'error');
                });
        }, 500);
    }


    // ============================================================
    // SECTION 6: WISHLIST TOGGLE (AJAX)
    // ============================================================
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const url = this.dataset.toggleUrl;
            if (!url) return;

            const button = this;

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        const icon = button.querySelector('i');
                        if (data.action === 'added') {
                            button.classList.add('active');
                            if (icon) {
                                icon.classList.replace('far', 'fas');
                                icon.style.color = '#dc3545';
                            }
                        } else {
                            button.classList.remove('active');
                            if (icon) {
                                icon.classList.replace('fas', 'far');
                                icon.style.color = '#aaa';
                            }
                            // On wishlist page, remove the card
                            const productId = button.dataset.productId;
                            if (productId) {
                                const card = document.getElementById(`wishlist-item-${productId}`);
                                if (card) {
                                    card.style.transition = 'opacity 0.3s, transform 0.3s';
                                    card.style.opacity = '0';
                                    card.style.transform = 'scale(0.9)';
                                    setTimeout(() => card.remove(), 300);
                                }
                            }
                        }
                        // Update wishlist badge in navbar
                        const badges = document.querySelectorAll('.wishlist-badge');
                        badges.forEach(b => {
                            b.textContent = data.wishlist_count;
                            if (data.wishlist_count <= 0) b.style.display = 'none';
                            else b.style.display = '';
                        });

                        showToast(data.message, 'success');
                    }
                })
                .catch(() => {
                    showToast('Could not update wishlist', 'error');
                });
        });
    });


    // ============================================================
    // SECTION 7: COUPON CODE (AJAX — checkout page only)
    // ============================================================
    const couponBtn = document.getElementById('apply-coupon-btn');
    if (couponBtn) {
        couponBtn.addEventListener('click', function () {
            const input = document.getElementById('coupon-input');
            const code = input.value.trim();
            if (!code) {
                showToast('Please enter a coupon code', 'warning');
                return;
            }

            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.disabled = true;

            fetch('/checkout/apply-coupon/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `code=${encodeURIComponent(code)}`,
            })
                .then(r => r.json())
                .then(data => {
                    const msgEl = document.getElementById('coupon-message');
                    if (data.success) {
                        msgEl.innerHTML = `<span class="text-success"><i class="fas fa-check-circle me-1"></i>${data.message}</span>`;
                        input.disabled = true;
                        this.innerHTML = '<i class="fas fa-check me-1"></i>Applied';

                        // Update discount row
                        const discountRow = document.getElementById('discount-row');
                        if (discountRow) {
                            discountRow.style.display = '';
                            const discountAmt = document.getElementById('discount-amount');
                            if (discountAmt) discountAmt.textContent = `-₹${data.discount}`;
                        }
                        // Update final total
                        const totalEl = document.getElementById('final-total');
                        if (totalEl) totalEl.textContent = `₹${data.final_total}`;

                        showToast(data.message, 'success');
                    } else {
                        msgEl.innerHTML = `<span class="text-danger"><i class="fas fa-times-circle me-1"></i>${data.message}</span>`;
                        this.innerHTML = originalText;
                        this.disabled = false;
                        showToast(data.message, 'error');
                    }
                })
                .catch(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                    showToast('Could not apply coupon', 'error');
                });
        });
    }


    // ============================================================
    // SECTION 8: PAYMENT METHOD TOGGLE (checkout page)
    // ============================================================
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            const fakeFields = document.getElementById('fake-card-fields');
            if (fakeFields) {
                if (this.value === 'sim') {
                    fakeFields.style.display = 'block';
                } else {
                    fakeFields.style.display = 'none';
                }
            }
        });
    });


    // ============================================================
    // SECTION 9: AUTO-DISMISS DJANGO MESSAGES
    // ============================================================
    document.querySelectorAll('.alert:not(.alert-light):not(.alert-info)').forEach(alert => {
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }, 4000);
    });


    // ============================================================
    // SECTION 10: STICKY NAVBAR SHADOW ON SCROLL
    // ============================================================
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-scroll');
            } else {
                navbar.classList.remove('shadow-scroll');
            }
        });
    }


    // ============================================================
    // SECTION 11: PRODUCT IMAGE ZOOM (product detail page)
    // ============================================================
    const mainImg = document.querySelector('.product-main-img');
    if (mainImg) {
        mainImg.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            this.style.transformOrigin = `${x}% ${y}%`;
        });
        mainImg.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.5)';
        });
        mainImg.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
            this.style.transformOrigin = 'center center';
        });
    }


    // ============================================================
    // SECTION 12: FORM VALIDATION FEEDBACK
    // ============================================================
    document.querySelectorAll('form.needs-validation').forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
            }
            form.classList.add('was-validated');
        });
    });


    // ============================================================
    // SECTION 13: REMOVE CART ITEM CONFIRMATION
    // ============================================================
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            if (!confirm('Remove this item from your cart?')) {
                e.preventDefault();
            }
        });
    });


    // ============================================================
    // SECTION 14: BACK TO TOP BUTTON
    // ============================================================
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
