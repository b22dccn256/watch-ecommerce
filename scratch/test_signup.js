const run = async () => {
    const email = `e2euser_test_${Date.now()}@example.com`;
    const password = 'E2eSecurePassw0rd!';
    const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
    
    try {
        // 1. Signup
        const signupRes = await fetch('http://localhost:5001/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Etest User',
                email: email,
                phone: phone,
                password: password,
                confirmPassword: password
            })
        });
        const signupData = await signupRes.json();
        console.log("SIGNUP STATUS:", signupRes.status);
        console.log("SIGNUP DATA:", signupData);

        if (signupRes.status !== 201) return;

        // 2. Login
        const loginRes = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log("LOGIN STATUS:", loginRes.status);
        console.log("LOGIN DATA:", loginData);

    } catch (err) {
        console.log("ERROR:", err.message);
    }
};

run();
