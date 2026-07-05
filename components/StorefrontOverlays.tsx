"use client";

import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import OrderHistoryModal from "./OrderHistoryModal";
import ProductDetailModal from "./ProductDetailModal";
import ReceiptModal from "./ReceiptModal";
import Toast from "./Toast";
import type { useStorefront } from "../hooks/useStorefront";

interface StorefrontOverlaysProps {
  store: ReturnType<typeof useStorefront>;
}

export default function StorefrontOverlays({ store }: StorefrontOverlaysProps) {
  return (
    <>
      {store.selectedProduct && (
        <ProductDetailModal
          key={store.selectedProduct.id}
          isOpen={store.selectedProduct !== null}
          product={store.selectedProduct}
          onClose={() => store.setSelectedProduct(null)}
          onAddToCart={store.handleAddToCart}
          onAddReview={store.handleAddReview}
          isReviewAuthenticated={Boolean(store.auth.user)}
          reviewerName={store.auth.displayName}
          onRequireSignInForReview={() => {
            store.triggerToast("Please sign in before submitting a review.", "user-circle");
            void store.auth.handleSignInWithGitHub();
          }}
        />
      )}

      {store.isCartOpen && (
        <CartDrawer
          key="cart-drawer"
          isOpen={store.isCartOpen}
          cart={store.cart}
          onClose={() => store.setIsCartOpen(false)}
          onAdjustQty={store.handleAdjustCartQty}
          onRemoveItem={store.handleRemoveCartItem}
          promoDiscount={store.promoDiscount}
          promoCodeText={store.promoCodeText}
          onApplyPromo={store.handleApplyPromo}
          onProceedToCheckout={store.handleProceedToCheckout}
        />
      )}

      {store.isCheckoutOpen && (
        <CheckoutModal
          key="checkout-modal"
          isOpen={store.isCheckoutOpen}
          cart={store.cart}
          onClose={() => store.setIsCheckoutOpen(false)}
          promoDiscount={store.promoDiscount}
          userId={store.auth.user?.id ?? null}
          onRequireSignIn={store.handleRequireSignInForOrder}
          onCheckoutSuccess={store.handleCheckoutSuccess}
        />
      )}

      {store.isSuccessOpen && store.currentOrder && (
        <ReceiptModal
          key={store.currentOrder.id}
          isOpen={store.isSuccessOpen}
          order={store.currentOrder}
          onClose={() => store.setIsSuccessOpen(false)}
          onCopyReceipt={() => store.triggerToast("Receipt copied to clipboard!", "copy")}
        />
      )}

      {store.isHistoryOpen && (
        <OrderHistoryModal
          key="history-modal"
          isOpen={store.isHistoryOpen}
          orders={store.orders}
          isLoading={store.isLoadingOrders}
          error={store.ordersError}
          onClose={() => store.setIsHistoryOpen(false)}
          onAskAboutOrder={store.handleAskAboutOrder}
          onCopyOrderId={store.handleCopyOrderId}
        />
      )}

      <Toast
        message={store.toastMessage}
        iconName={store.toastIcon}
        visible={store.toastVisible}
        onDismiss={() => store.setToastVisible(false)}
      />
    </>
  );
}
