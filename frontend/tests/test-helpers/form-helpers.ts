export function findErrorElementFromFormInput(input: HTMLElement): HTMLElement {
  const errorElementId = input.getAttribute('aria-describedby')
  const dataPath = input.getAttribute('data-path') ?? '<unknown>'
  if (!errorElementId) {
    throw new Error(`aria-describedby attribute not found for ${dataPath} input`)
  }
  const errorElement = document.getElementById(errorElementId)
  if (!errorElement) {
    throw new Error(`error element not found for ${dataPath} input`)
  }
  return errorElement
}
