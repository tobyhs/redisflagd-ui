import type { Flag } from '../../src/flags/Flag'

export const FlagFactory = {
  booleanFlag(): Flag {
    return {
      key: 'basic-boolean',
      state: 'ENABLED',
      variants: { on: true, off: false },
      defaultVariant: 'on',
    }
  },

  stringFlag(): Flag {
    return {
      key: 'basic-string',
      state: 'ENABLED',
      variants: { red: 'r', green: 'g', blue: 'b' },
      defaultVariant: 'blue',
    }
  },
}
