import axios from "axios";

const axiosInstance = axios.create({
	baseURL: "/api",
	withCredentials: true, // send cookies to the server
});

const readCookie = (name) => {
	if (typeof document === "undefined") return null;
	const value = document.cookie
		.split("; ")
		.find((entry) => entry.startsWith(`${name}=`));
	return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : null;
};

axiosInstance.interceptors.request.use((config) => {
	// attach timing metadata for client-side diagnostics
	try { config.metadata = { startTime: Date.now() }; } catch (error) { void error; }
	const method = (config.method || "get").toLowerCase();
	if (["post", "put", "patch", "delete"].includes(method)) {
		const csrfToken = readCookie("csrfToken");
		if (csrfToken) {
			config.headers = config.headers || {};
			config.headers["X-CSRF-Token"] = csrfToken;
		}
	}
	return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	});
	failedQueue = [];
};

axiosInstance.interceptors.response.use(
	(response) => {
		try {
			const meta = response.config?.metadata;
			if (meta && meta.startTime) {
				const elapsed = Date.now() - meta.startTime;
				console.log(`[axios] ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url} ${elapsed}ms`);
			}
		} catch (error) { void error; }
		return response;
	},
	async (error) => {
		try {
			const meta = error.config?.metadata;
			if (meta && meta.startTime) {
				const elapsed = Date.now() - meta.startTime;
				console.log(`[axios] ERROR ${error.config?.method?.toUpperCase() || 'GET'} ${error.config?.url} ${elapsed}ms`);
			}
		} catch (error) { void error; }

		const originalRequest = error.config;

		// Whitelist logic
		const whitelistUrls = ["/auth/refresh-token", "/auth/login", "/auth/logout", "/auth/profile"];
		const requestUrl = originalRequest?.url || "";
		const isWhitelisted = whitelistUrls.some((url) => requestUrl.includes(url));
		const shouldSkipRefresh = Boolean(originalRequest?.skipRefresh);

		if (error.response?.status === 401 && !originalRequest?._retry && !isWhitelisted && !shouldSkipRefresh) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then(() => {
						return axiosInstance(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				await axiosInstance.post("/auth/refresh-token");
				processQueue(null, true);
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				// Silently fail — checkAuth will handle re-login on next page load
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;
