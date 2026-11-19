export interface ShippingInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const DEFAULT_SHIPPING: ShippingInfo = {
  firstName: "Yash",
  lastName: "Vardhan",
  postalCode: "M5V 3X4",
};

export const CHECKOUT_ERRORS = {
  firstName: "First Name is required",
  lastName: "Last Name is required",
  postalCode: "Postal Code is required",
};

export const ORDER_CONFIRMATION = {
  title: "Order Placed!",
  message: "Thank you for your purchase. Your order has been successfully submitted.",
};
