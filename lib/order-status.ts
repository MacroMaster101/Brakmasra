// Client-safe order status list, shared by the server loaders and the Control Room forms.
export const ORDER_STATUS_VALUES = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;
export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];
