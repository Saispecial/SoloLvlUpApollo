/**
 * Integration Test Runner
 * Run with: npx tsx scripts/test-integration.ts
 */

import { runAllIntegrationTests } from "../lib/utils/integrationTest"

async function main() {
  try {
    const results = await runAllIntegrationTests()
    process.exit(results.success ? 0 : 1)
  } catch (error) {
    console.error("Fatal error running tests:", error)
    process.exit(1)
  }
}

main()
