export function keyboardEscape(text: string): string {
  return text.replaceAll('{', '{{').replaceAll('[', '[[')
}
