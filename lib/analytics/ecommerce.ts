import { sendGTMEvent } from "@next/third-parties/google";
import type { Cart, CartItem, Product, ProductVariant } from "lib/shopify/types";

function pushEcommerceEvent(event: string, ecommerce: Record<string, unknown>) {
  sendGTMEvent({ ecommerce: null });
  sendGTMEvent({ event, ecommerce });
}

export function trackAddToCart(variant: ProductVariant, product: Product) {
  pushEcommerceEvent("add_to_cart", {
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount),
    items: [
      {
        item_id: variant.sku || variant.id,
        item_name: product.title,
        item_variant: variant.title,
        price: Number(variant.price.amount),
      },
    ],
  });
}

export function trackRemoveFromCart(item: CartItem) {
  pushEcommerceEvent("remove_from_cart", {
    currency: item.cost.totalAmount.currencyCode,
    value: Number(item.cost.totalAmount.amount),
    items: [
      {
        item_id: item.merchandise.id,
        item_name: item.merchandise.product.title,
        item_variant: item.merchandise.title,
        quantity: item.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(cart: Cart) {
  pushEcommerceEvent("begin_checkout", {
    currency: cart.cost.totalAmount.currencyCode,
    value: Number(cart.cost.totalAmount.amount),
    items: cart.lines.map((line) => ({
      item_id: line.merchandise.id,
      item_name: line.merchandise.product.title,
      item_variant: line.merchandise.title,
      quantity: line.quantity,
      price: Number(line.cost.totalAmount.amount),
    })),
  });
}
