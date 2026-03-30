import ipaddr from "ipaddr.js";

// Parse danh sách IP/CIDR từ env
const parseList = (listString) => {
	if (!listString) return [];
	return listString
		.split(/\s*,\s*/)
		.filter(Boolean)
		.map((item) => item.trim());
};

const normalizeIp = (ip) => {
	if (!ip) return null;
	if (ip.startsWith("::ffff:")) {
		return ip.replace("::ffff:", "");
	}
	return ip;
};

const isIpInCidr = (ip, entry) => {
	try {
		if (!ip || !entry) return false;
		if (entry.includes("/")) {
			const [range, prefix] = entry.split("/");
			const parsedIp = ipaddr.parse(ip);
			const parsedRange = ipaddr.parse(range);
			return parsedIp.match(parsedRange, parseInt(prefix, 10));
		}
		return ip === entry;
	} catch (error) {
		return false;
	}
};

export const ipWhitelist = (provider) => {
	return (req, res, next) => {
		// Hỗ trợ proxy với x-forwarded-for
		const forwarded = req.headers["x-forwarded-for"];
		const remoteIp = forwarded ? forwarded.split(",")[0].trim() : req.ip || req.connection?.remoteAddress;
		const ip = normalizeIp(remoteIp);

		const whiteListEnv = process.env[`${provider.toUpperCase()}_IP_WHITELIST`] || "";
		const whiteList = parseList(whiteListEnv);

		console.info(`[IPWhitelist] provider=${provider} ip=${ip} whitelist=${whiteList.join(",")}`);

		if (!ip) {
			return res.status(403).json({ message: "IP không hợp lệ" });
		}

		const allowed = whiteList.some((entry) => isIpInCidr(ip, entry));
		if (!allowed) {
			console.warn(`[IPWhitelist] provider=${provider} reject ip=${ip}`);
			return res.status(403).json({ message: "IP không được phép" });
		}

		next();
	};
};
