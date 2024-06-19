module.exports = {
  apps: [
    {
      name: "sige-whatsapp",
      script: "./dist/main.js",
      // Restart after memory hit 1GB
      max_memory_restart: "6G",
      // Env variables
      env: {
        NODE_ENV: "production"
      },
      args: ["--color"]
    }
  ]
}
