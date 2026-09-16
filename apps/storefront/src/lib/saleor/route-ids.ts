export function encodeNtmsSaleorOrderRouteId(orderId: string) {
  return toBase64(orderId)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeNtmsSaleorOrderRouteId(encodedOrderId: string) {
  const base64 = encodedOrderId.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return fromBase64(paddedBase64);
}

function toBase64(value: string) {
  if (typeof btoa !== "undefined") {
    return btoa(value);
  }

  return Buffer.from(value, "utf8").toString("base64");
}

function fromBase64(value: string) {
  if (typeof atob !== "undefined") {
    return atob(value);
  }

  return Buffer.from(value, "base64").toString("utf8");
}
