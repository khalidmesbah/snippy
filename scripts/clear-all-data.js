import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function clearAllData() {
  try {
    console.log("🗑️  Starting database cleanup...")

    // Delete all data from tables (in correct order due to foreign key constraints)
    console.log("Deleting all snippets...")
    const snippetsResult = await sql`DELETE FROM snippets`
    console.log(`✅ Deleted ${snippetsResult.length} snippets`)

    console.log("Deleting all collections...")
    const collectionsResult = await sql`DELETE FROM collections`
    console.log(`✅ Deleted ${collectionsResult.length} collections`)

    console.log("Deleting all users...")
    const usersResult = await sql`DELETE FROM users`
    console.log(`✅ Deleted ${usersResult.length} users`)

    // Reset sequences to start from 1 (if using serial columns)
    console.log("Resetting database sequences...")
    await sql`SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false)`
    await sql`SELECT setval(pg_get_serial_sequence('collections', 'id'), 1, false)`
    await sql`SELECT setval(pg_get_serial_sequence('snippets', 'id'), 1, false)`

    console.log("🎉 Database cleanup completed successfully!")
    console.log("📊 Database is now empty and ready for fresh data.")

    // Verify tables are empty
    console.log("\n📋 Verification:")
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const collectionCount = await sql`SELECT COUNT(*) as count FROM collections`
    const snippetCount = await sql`SELECT COUNT(*) as count FROM snippets`

    console.log(`Users: ${userCount[0].count}`)
    console.log(`Collections: ${collectionCount[0].count}`)
    console.log(`Snippets: ${snippetCount[0].count}`)
  } catch (error) {
    console.error("❌ Error clearing database:", error)
    throw error
  }
}

// Execute the cleanup
clearAllData()
  .then(() => {
    console.log("\n✨ All done! The database is now completely clean.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Failed to clear database:", error)
    process.exit(1)
  })
