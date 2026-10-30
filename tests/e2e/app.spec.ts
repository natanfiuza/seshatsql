import { _electron as electron, expect, test } from '@playwright/test'

test('opens the main window with the product name', async () => {
  const app = await electron.launch({ args: ['.'] })

  try {
    const window = await app.firstWindow()
    await expect(window.locator('h1')).toHaveText('SeshatSQL')
  } finally {
    await app.close()
  }
})
