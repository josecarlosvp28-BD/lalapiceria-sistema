export function formatoSoles(centavos: number): string {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(centavos / 100);
}

export function soles(input: string): number {
  const n = Number(input.replace(/[^0-9.]/g, ""));
  return Math.round(n * 100);
}
