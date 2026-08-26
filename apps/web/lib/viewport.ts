export interface HoverableScenePart {
  category: string;
  label: string;
}

export function formatHoverLabel(part: HoverableScenePart): string {
  return `${part.category} · ${part.label}`;
}

export function canRenderTwin(products: readonly { category: string }[]): boolean {
  return products.some((product) => product.category === "CASE");
}
