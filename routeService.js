export async function calculateRouteManually(routeInput) {
  return {
    mode: "manual",
    startAddress: routeInput.startAddress,
    destinationAddress: routeInput.destinationAddress,
    totalKm: routeInput.totalKm,
    tollKm: routeInput.tollKm,
    provider: "manual",
    status: "Manuelle Kilometerwerte aktiv",
  };
}

export async function calculateRouteWithExternalApi(routeInput) {
  throw new Error(
    `Routen-API noch nicht angebunden: ${routeInput.startAddress} nach ${routeInput.destinationAddress}`,
  );
}
