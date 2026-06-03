import fetch from "node-fetch";

async function login() {
  const res = await fetch("http://localhost:5001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@test.local.com",
      password: "Admin123!@#",
    }),
    redirect: "manual",
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Headers:", res.headers.raw());
  console.log("Body:", text);
}

login().catch((e) => {
  console.error(e);
  process.exit(1);
});
