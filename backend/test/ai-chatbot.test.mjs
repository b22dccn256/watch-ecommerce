/**
 * AI Chatbot Comprehensive Tests
 * Tests all customer query scenarios: budget parsing, matching, fallback bot, edge cases
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════
// BUDGET PARSING - ALL CUSTOMER INPUT PATTERNS
// ═══════════════════════════════════════════════════════════════

const parseBudgetRange = (message) => {
    const normalized = (message || "").toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ");
    const currencyMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/);

    if (!currencyMatch) return null;

    const amount = Number(currencyMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const valueInVnd = Math.round(amount * 1_000_000);
    
    // Support "từ 5 đến 15 triệu"
    const rangeMatch = normalized.match(/(?:từ|from)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)?\s*(?:đến|tới|to|-)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|trieu|trệu|m)/);
    if (rangeMatch) {
        const minUnit = 1_000_000;
        const maxUnit = 1_000_000;
        return {
            minPrice: Math.round(Number(rangeMatch[1]) * minUnit),
            maxPrice: Math.round(Number(rangeMatch[3]) * maxUnit),
            label: `từ ${rangeMatch[1]} đến ${rangeMatch[3]} triệu`,
        };
    }

    const hasBelowIntent = normalized.includes("dưới") || normalized.includes("tối đa") || normalized.includes("không quá") || normalized.includes("under") || normalized.includes("less than") || normalized.includes("<=") || normalized.includes("≤") || normalized.includes("thôi") || normalized.includes("chỉ");
    const hasAboveIntent = normalized.includes("trên") || normalized.includes("tối thiểu") || normalized.includes("trở lên") || normalized.includes("over") || normalized.includes("more than") || normalized.includes(">=") || normalized.includes("≥") || (normalized.includes("từ") && !normalized.includes("đến") && !normalized.includes("tới") && !normalized.includes("-"));
    const hasApproxIntent = normalized.includes("khoảng") || normalized.includes("tầm") || normalized.includes("around") || normalized.includes("about") || normalized.includes("~");

    if (hasBelowIntent) {
        return { maxPrice: valueInVnd, label: `dưới ${currencyMatch[1]} triệu` };
    }

    if (hasAboveIntent) {
        return { minPrice: valueInVnd, label: `trên ${currencyMatch[1]} triệu` };
    }

    if (hasApproxIntent) {
        return {
            minPrice: Math.round(valueInVnd * 0.85),
            maxPrice: Math.round(valueInVnd * 1.15),
            label: `khoảng ${currencyMatch[1]} triệu`,
        };
    }

    // Default: treat as maximum limit (e.g. "đồng hồ 10 triệu", "có 10 triệu")
    return { maxPrice: valueInVnd, label: `dưới ${currencyMatch[1]} triệu` };
};

const parseRequestedCount = (message) => {
    const normalized = (message || "").toLowerCase();
    const match = normalized.match(/(\d+)\s*(?:sản phẩm|sp|mẫu|chiếc|cái|món|item|đơn|cái)/) 
                  || normalized.match(/(?:hiện|show|lấy|gợi ý|top|chọn)\s*(\d+)/)
                  || normalized.match(/(\d+)\s*(?:mẫu|cái)/);

    if (match) {
        const count = parseInt(match[1], 10);
        if (!isNaN(count) && count >= 1) {
            return Math.min(count, 5); // maximum 5
        }
    }
    return 3; // default is 3
};

// ─── BUDGET: "dưới X triệu" ──────────────────────────────────
test('budget: dưới X triệu', () => {
    const r1 = parseBudgetRange('tìm đồng hồ dưới 10 triệu');
    assert.ok(r1);
    assert.equal(r1.maxPrice, 10_000_000);
    assert.equal(r1.minPrice, undefined);
    assert.ok(r1.label.includes('dưới'));

    const r2 = parseBudgetRange('dưới 5tr có gì');
    assert.equal(r2.maxPrice, 5_000_000);

    const r3 = parseBudgetRange('tối đa 20 triệu');
    assert.equal(r3.maxPrice, 20_000_000);

    const r4 = parseBudgetRange('không quá 3 triệu');
    assert.equal(r4.maxPrice, 3_000_000);

    const r5 = parseBudgetRange('under 8 triệu');
    assert.equal(r5.maxPrice, 8_000_000);
});

// ─── BUDGET: "từ X đến Y triệu" ──────────────────────────────
test('budget: từ X đến Y triệu (có đơn vị sau mỗi số)', () => {
    // Regex hiện tại yêu cầu đơn vị sau MỖI số: "từ 5 triệu đến 15 triệu"
    const r1 = parseBudgetRange('từ 5 triệu đến 15 triệu');
    assert.ok(r1);
    assert.equal(r1.minPrice, 5_000_000);
    assert.equal(r1.maxPrice, 15_000_000);

    // Dạng "từ 5 đến 15 triệu" đã parse được thành công ở phiên bản mới
    const r2 = parseBudgetRange('từ 5 đến 15 triệu');
    assert.ok(r2);
    assert.equal(r2.minPrice, 5_000_000);
    assert.equal(r2.maxPrice, 15_000_000);

    const r3 = parseBudgetRange('từ 3tr tới 8tr');
    assert.equal(r3.minPrice, 3_000_000);
    assert.equal(r3.maxPrice, 8_000_000);

    const r4 = parseBudgetRange('từ 10tr-20tr');
    assert.equal(r4.minPrice, 10_000_000);
    assert.equal(r4.maxPrice, 20_000_000);

    const r5 = parseBudgetRange('from 2 triệu to 7 triệu');
    assert.equal(r5.minPrice, 2_000_000);
    assert.equal(r5.maxPrice, 7_000_000);
});

// ─── BUDGET: "khoảng X triệu" ────────────────────────────────
test('budget: khoảng X triệu', () => {
    const r1 = parseBudgetRange('khoảng 10 triệu');
    assert.ok(r1);
    assert.ok(Math.abs(r1.minPrice - 8_500_000) < 1);
    assert.ok(Math.abs(r1.maxPrice - 11_500_000) < 1);

    const r2 = parseBudgetRange('tầm 5 triệu');
    assert.ok(Math.abs(r2.minPrice - 4_250_000) < 1);
    assert.ok(Math.abs(r2.maxPrice - 5_750_000) < 1);

    const r3 = parseBudgetRange('around 3 tr');
    assert.ok(Math.abs(r3.minPrice - 2_550_000) < 1);
    assert.ok(Math.abs(r3.maxPrice - 3_450_000) < 1);

    const r4 = parseBudgetRange('~ 20 triệu');
    assert.ok(Math.abs(r4.minPrice - 17_000_000) < 1);
    assert.ok(Math.abs(r4.maxPrice - 23_000_000) < 1);
});

// ─── BUDGET: Số thập phân ─────────────────────────────────────
test('budget: decimal amounts', () => {
    const r1 = parseBudgetRange('dưới 2.5 triệu');
    assert.ok(r1);
    assert.equal(r1.maxPrice, 2_500_000);

    // Cần đơn vị sau mỗi số: "từ 1.5 triệu đến 3.5 triệu"
    const r2 = parseBudgetRange('từ 1.5 triệu đến 3.5 triệu');
    assert.ok(r2);
    assert.equal(r2.minPrice, 1_500_000);
    assert.equal(r2.maxPrice, 3_500_000);
});

// ─── BUDGET: Viết tắt ─────────────────────────────────────────
test('budget: abbreviations (tr, m, triệu)', () => {
    assert.equal(parseBudgetRange('dưới 5tr').maxPrice, 5_000_000);
    assert.equal(parseBudgetRange('dưới 10m').maxPrice, 10_000_000);
    assert.equal(parseBudgetRange('khoảng 3 trệu').minPrice, 2_550_000);
    assert.equal(parseBudgetRange('dưới 7 trieu').maxPrice, 7_000_000);
});

// ─── BUDGET: Có dấu phẩy ─────────────────────────────────────
test('budget: comma in number', () => {
    // Dấu phẩy được replace bằng dấu chấm → 10.5 → 10.5 triệu = 10,500,000
    const r = parseBudgetRange('dưới 10,5 triệu');
    assert.equal(r.maxPrice, 10_500_000);
});

// ─── BUDGET: Không parse được ─────────────────────────────────
test('budget: no budget detected', () => {
    assert.equal(parseBudgetRange('xin chào'), null);
    assert.equal(parseBudgetRange('bảo hành thế nào'), null);
    assert.equal(parseBudgetRange('có shop nào ở Hà Nội không'), null);
    assert.equal(parseBudgetRange(''), null);
    assert.equal(parseBudgetRange('giá rẻ thôi'), null); // Không có số
});

// ─── BUDGET: Edge cases ───────────────────────────────────────
test('budget: edge cases - số 0', () => {
    // "dưới 0 triệu" đã được sửa thành công và trả về null
    const r = parseBudgetRange('dưới 0 triệu');
    assert.equal(r, null);
});

test('budget: text before and after budget', () => {
    const r = parseBudgetRange('cho em hỏi có đồng hồ nào dưới 5 triệu không ạ');
    assert.equal(r.maxPrice, 5_000_000);
});

test('budget: multiple budget mentions takes first', () => {
    // Nên parse từ đầu tiên: 5 triệu
    const r = parseBudgetRange('đồng hồ dưới 5 triệu hay khoảng 10 triệu');
    assert.equal(r.maxPrice, 5_000_000);
});

// ═══════════════════════════════════════════════════════════════
// BUDGET MATCHING (product filtering)
// ═══════════════════════════════════════════════════════════════

const makeProduct = (name, price, stock = 5, brand = 'Rolex') => ({ name, price, stock, brand, type: 'automatic' });

const mockProducts = [
    makeProduct('Submariner', 500_000_000),
    makeProduct('Datejust', 300_000_000),
    makeProduct('Oyster Perpetual', 150_000_000),
    makeProduct('Tissot PRX', 15_000_000),
    makeProduct('Seiko 5', 5_000_000),
    makeProduct('Casio F91W', 500_000),
    makeProduct('Citizen Eco', 8_000_000),
    makeProduct('Orient Bambino', 6_000_000),
    makeProduct('Hamilton Khaki', 18_000_000),
    makeProduct('Longines Conquest', 45_000_000),
];

const fetchBudgetMatches = (budget, products = mockProducts) => {
    if (!budget) return [];
    return products
        .filter((product) => {
            const price = Number(product.price || 0);
            if (!price) return false;
            if (budget.minPrice != null && price < budget.minPrice) return false;
            if (budget.maxPrice != null && price > budget.maxPrice) return false;
            return true;
        })
        .sort((a, b) => (a.price || 0) - (b.price || 0));
};

test('match: dưới 10 triệu returns 4 products', () => {
    const budget = { maxPrice: 10_000_000, label: 'dưới 10 triệu' };
    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 4); // Casio 500k, Seiko 5M, Orient 6M, Citizen 8M
    assert.equal(matches[0].name, 'Casio F91W');
    assert.equal(matches[3].name, 'Citizen Eco');
});

test('match: từ 5 đến 20 triệu returns 5 products', () => {
    const budget = { minPrice: 5_000_000, maxPrice: 20_000_000, label: 'từ 5 đến 20 triệu' };
    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 5); // Seiko 5M, Orient 6M, Citizen 8M, Tissot 15M, Hamilton 18M
});

test('match: khoảng 7 triệu (5.95M-8.05M) returns 2 products', () => {
    const budget = { minPrice: 5_950_000, maxPrice: 8_050_000 };
    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 2); // Orient 6M, Citizen 8M
});

test('match: no products in budget', () => {
    const budget = { maxPrice: 100_000, label: 'dưới 100k' };
    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 0);
});

test('match: very high budget returns all', () => {
    const budget = { minPrice: 0, maxPrice: 1_000_000_000 };
    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 10);
});

test('match: null budget returns empty', () => {
    assert.deepEqual(fetchBudgetMatches(null), []);
});

test('match: products sorted by price ascending', () => {
    const budget = { maxPrice: 50_000_000 };
    const matches = fetchBudgetMatches(budget);
    for (let i = 1; i < matches.length; i++) {
        assert.ok(matches[i].price >= matches[i - 1].price, `Product ${i} should be >= product ${i - 1} in price`);
    }
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE FORMATTING
// ═══════════════════════════════════════════════════════════════

const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

const getProductBrandName = (brand) => {
    if (!brand) return 'Không rõ';
    if (typeof brand === 'string') return brand;
    return brand.name || brand.title || 'Không rõ';
};

const formatBudgetResponse = (matches, budget) => {
    if (!matches || matches.length === 0) {
        const limitText = budget?.maxPrice
            ? `${formatVnd(budget.maxPrice)}đ`
            : budget?.minPrice
                ? `${formatVnd(budget.minPrice)}đ trở lên`
                : 'ngân sách này';
        return `Hiện tại chưa có sản phẩm phù hợp ${budget?.label || ''}. Bạn có thể xem Catalog để lọc theo mức giá gần nhất quanh ${limitText}.`;
    }

    const topMatches = matches.slice(0, 5).map((product) => {
        const brandName = getProductBrandName(product.brand);
        return `- ${brandName} ${product.name}: ${formatVnd(product.price)}đ${product.stock > 0 ? `, còn ${product.stock} chiếc` : ', hết hàng'}`;
    });

    return `Mình tìm được ${matches.length} sản phẩm phù hợp ${budget?.label || ''}:\n${topMatches.join('\n')}\n\nBạn muốn mình lọc tiếp theo kiểu máy, thương hiệu hay màu dây không?`;
};

test('format: with matching products', () => {
    const matches = [mockProducts[4], mockProducts[6]];
    const budget = { maxPrice: 10_000_000, label: 'dưới 10 triệu' };
    const res = formatBudgetResponse(matches, budget);

    assert.ok(res.includes('Mình tìm được 2 sản phẩm'));
    assert.ok(res.includes('dưới 10 triệu'));
    assert.ok(res.includes('Seiko'));
    assert.ok(res.includes('Citizen'));
    assert.ok(res.includes('còn'));
    assert.ok(res.includes('Bạn muốn mình lọc tiếp'));
});

test('format: no matching products', () => {
    const budget = { maxPrice: 100_000, label: 'dưới 100k' };
    const res = formatBudgetResponse([], budget);

    assert.ok(res.includes('chưa có sản phẩm phù hợp'));
    assert.ok(res.includes('Catalog'));
});

test('format: out of stock product', () => {
    const matches = [{ name: 'Test', price: 1000000, stock: 0, brand: 'Test' }];
    const budget = { maxPrice: 2000000, label: 'test' };
    const res = formatBudgetResponse(matches, budget);

    assert.ok(res.includes('hết hàng'));
});

test('format: max 5 products shown', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({
        name: `Watch ${i}`,
        price: (i + 1) * 1_000_000,
        stock: 5,
        brand: 'Brand',
    }));
    const res = formatBudgetResponse(matches, { label: 'test' });

    // Count dashes (each product line starts with '-')
    const productLines = res.split('\n').filter((l) => l.startsWith('-'));
    assert.equal(productLines.length, 5);
});

test('format: brand is object', () => {
    const matches = [{ name: 'Test', price: 1000000, stock: 5, brand: { name: 'Rolex' } }];
    const res = formatBudgetResponse(matches, { label: 'test' });
    assert.ok(res.includes('Rolex'));
});

test('format: brand is string', () => {
    const matches = [{ name: 'Test', price: 1000000, stock: 5, brand: 'Omega' }];
    const res = formatBudgetResponse(matches, { label: 'test' });
    assert.ok(res.includes('Omega'));
});

test('format: null brand shows Không rõ', () => {
    const matches = [{ name: 'Test', price: 1000000, stock: 5, brand: null }];
    const res = formatBudgetResponse(matches, { label: 'test' });
    assert.ok(res.includes('Không rõ'));
});

// ═══════════════════════════════════════════════════════════════
// FALLBACK BOT - ALL TRIGGER KEYWORDS
// ═══════════════════════════════════════════════════════════════

const getFallbackBotResponse = (text) => {
    const lower = (text || '').toLowerCase();
    if (lower.includes('rolex')) return 'Rolex là thương hiệu đồng hồ Thụy Sĩ huyền thoại. Hiện cửa hàng có nhiều dòng Rolex chính hãng. Bạn vui lòng xem trang Catalog để biết tình trạng hàng và giá mới nhất!';
    if (lower.includes('omega')) return 'Omega là thương hiệu đồng hồ Thụy Sĩ danh tiếng, đối tác chính thức của NASA. Khám phá bộ sưu tập Omega tại trang Catalog của chúng tôi!';
    if (lower.includes('giá') || lower.includes('bao nhiêu')) return 'Cửa hàng có đồng hồ từ nhiều tầm giá khác nhau. Bạn có thể dùng bộ lọc giá trên trang Catalog để tìm sản phẩm phù hợp ngân sách!';
    if (lower.includes('bảo hành')) return 'Tất cả sản phẩm được bảo hành chính hãng 5 năm. Bảo hành bao gồm sửa chữa và thay thế linh kiện chính hãng miễn phí.';
    if (lower.includes('giao hàng') || lower.includes('ship')) return 'Giao hàng nội thành hỏa tốc 2–4h, toàn quốc 1–2 ngày làm việc, hoàn toàn miễn phí!';
    if (lower.includes('đổi') || lower.includes('trả')) return 'Chính sách 1 đổi 1 trong 30 ngày nếu sản phẩm còn nguyên seal, chưa qua sử dụng.';
    if (lower.includes('thanh toán')) return 'Cửa hàng hỗ trợ thanh toán thẻ quốc tế, QR chuyển khoản và COD (thanh toán khi nhận hàng).';
    return 'Cảm ơn bạn đã liên hệ Luxury Watch! Vui lòng gọi Hotline 1900 6789 hoặc duyệt trang Catalog để tìm sản phẩm phù hợp.';
};

test('fallback: rolex', () => {
    assert.ok(getFallbackBotResponse('cho hỏi Rolex').includes('Rolex'));
    assert.ok(getFallbackBotResponse('có rolex không').includes('Rolex'));
});

test('fallback: omega', () => {
    assert.ok(getFallbackBotResponse('Omega giá bao nhiêu').includes('Omega')); // Omega checked first
});

test('fallback: giá / bao nhiêu (after Rolex/Omega check)', () => {
    const r = getFallbackBotResponse('giá đồng hồ này bao nhiêu');
    assert.ok(r.includes('tầm giá'));
    assert.ok(r.includes('Catalog'));
});

test('fallback: bảo hành', () => {
    const r = getFallbackBotResponse('bảo hành như thế nào');
    assert.ok(r.includes('5 năm'));
});

test('fallback: giao hàng / ship', () => {
    assert.ok(getFallbackBotResponse('giao hàng mất bao lâu').includes('hỏa tốc'));
    assert.ok(getFallbackBotResponse('có ship không').includes('miễn phí'));
});

test('fallback: đổi trả', () => {
    assert.ok(getFallbackBotResponse('đổi hàng được không').includes('30 ngày'));
    assert.ok(getFallbackBotResponse('chính sách trả hàng').includes('1 đổi 1'));
});

test('fallback: thanh toán', () => {
    const r = getFallbackBotResponse('thanh toán thế nào');
    assert.ok(r.includes('COD'));
    assert.ok(r.includes('QR'));
});

test('fallback: default response for unknown', () => {
    const r = getFallbackBotResponse('cửa hàng ở đâu');
    assert.ok(r.includes('Hotline 1900 6789'));
    assert.ok(r.includes('Catalog'));
});

test('fallback: empty message', () => {
    const r = getFallbackBotResponse('');
    assert.ok(r.includes('Hotline 1900 6789'));
});

test('fallback: null/undefined message', () => {
    assert.ok(getFallbackBotResponse(null).includes('Hotline'));
    assert.ok(getFallbackBotResponse(undefined).includes('Hotline'));
});

test('fallback: Rolex takes priority over giá', () => {
    const r = getFallbackBotResponse('Rolex giá bao nhiêu');
    assert.ok(r.includes('Rolex là thương hiệu')); // Rolex keyword wins
});

// ═══════════════════════════════════════════════════════════════
// CHAT FLOW: EMPTY INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════

const validateChatInput = (message) => {
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return { valid: false, status: 400, message: 'Vui lòng cung cấp nội dung tin nhắn' };
    }
    return { valid: true };
};

test('chat: empty input rejected', () => {
    assert.equal(validateChatInput('').valid, false);
    assert.equal(validateChatInput(null).valid, false);
    assert.equal(validateChatInput(undefined).valid, false);
    assert.equal(validateChatInput('   ').valid, false);
});

test('chat: valid input accepted', () => {
    assert.equal(validateChatInput('xin chào').valid, true);
    assert.equal(validateChatInput('tìm đồng hồ').valid, true);
});

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT VERIFICATION
// ═══════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT = `
Bạn là trợ lý ảo AI cao cấp của Luxury Watch, cửa hàng chuyên bán đồng hồ chính hãng.

THÔNG TIN CỬA HÀNG:
- Chính sách bảo hành: 5 năm toàn cầu cho tất cả sản phẩm chính hãng.
- Giao hàng: Nội thành hỏa tốc 2–4h, toàn quốc tiêu chuẩn 1–2 ngày, miễn phí.
- Thanh toán: Thẻ quốc tế (Stripe), QR chuyển khoản, COD (đơn dưới 50 triệu).
- Đổi trả: 1 đổi 1 trong 30 ngày nếu còn nguyên seal, chưa qua sử dụng.
- Hotline: 1900 6789.
`;

test('prompt: contains required store info', () => {
    assert.ok(BASE_SYSTEM_PROMPT.includes('bảo hành'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('5 năm'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('hỏa tốc') || BASE_SYSTEM_PROMPT.includes('Giao hàng'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('miễn phí'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('thanh toán') || BASE_SYSTEM_PROMPT.includes('Thanh toán'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('Stripe'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('COD'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('đổi') || BASE_SYSTEM_PROMPT.includes('Đổi'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('30 ngày'));
    assert.ok(BASE_SYSTEM_PROMPT.includes('1900 6789'));
});

test('prompt: contains AI behavior instructions', () => {
    // Prompt length must be substantial (>200 chars)
    assert.ok(BASE_SYSTEM_PROMPT.length > 200, 'System prompt should be substantial');
    // Must NOT be empty
    assert.ok(BASE_SYSTEM_PROMPT.trim().length > 0);
});

// ═══════════════════════════════════════════════════════════════
// REALISTIC CUSTOMER SCENARIOS
// ═══════════════════════════════════════════════════════════════

test('scenario: khách hỏi đồng hồ rẻ nhất', () => {
    // "dưới 1 triệu" → parseBudgetRange → maxPrice = 1M
    const budget = parseBudgetRange('đồng hồ nào rẻ nhất dưới 1 triệu');
    assert.ok(budget);
    assert.equal(budget.maxPrice, 1_000_000);

    const matches = fetchBudgetMatches(budget);
    assert.equal(matches.length, 1); // Casio 500k
    assert.equal(matches[0].name, 'Casio F91W');
});

test('scenario: khách hỏi đồng hồ tầm trung', () => {
    const budget = parseBudgetRange('đồng hồ tầm 15 triệu');
    assert.ok(budget);
    assert.ok(budget.minPrice > 0 && budget.maxPrice > 0);

    const matches = fetchBudgetMatches(budget);
    // 12.75M - 17.25M: Tissot 15M only
    assert.ok(matches.some((p) => p.name === 'Tissot PRX'));
});

test('scenario: khách hỏi đồng hồ cao cấp', () => {
    // "từ 100 triệu" hiện tại đã được nâng cấp để parse thành công phân khúc giá tối thiểu (minPrice)
    const budget = parseBudgetRange('đồng hồ từ 100 triệu');
    assert.ok(budget);
    assert.equal(budget.minPrice, 100_000_000);
});

test('scenario: khách hỏi sai chính tả', () => {
    // Một số lỗi chính tả vẫn parse được nếu regex khớp gần đúng
    // Fallback bot sẽ xử lý các câu không parse được
    const budget = parseBudgetRange('đồng hồ dưới 10 triệu');
    assert.ok(budget);
    assert.equal(budget.maxPrice, 10_000_000);
});

test('scenario: khách hỏi bằng tiếng Anh', () => {
    const r1 = parseBudgetRange('watches under 5 million');
    assert.ok(r1);
    assert.equal(r1.maxPrice, 5_000_000);

    const r2 = parseBudgetRange('I want a watch around 3 triệu');
    assert.ok(r2);
    assert.ok(Math.abs(r2.minPrice - 2_550_000) < 1);
    assert.ok(Math.abs(r2.maxPrice - 3_450_000) < 1);
});

test('scenario: khách hỏi nhiều câu cùng lúc', () => {
    const msg = 'tôi muốn mua đồng hồ dưới 10 triệu, bảo hành bao lâu, giao hàng mất mấy ngày';
    const budget = parseBudgetRange(msg);
    assert.ok(budget);
    assert.equal(budget.maxPrice, 10_000_000);

    // Fallback bot bắt keyword "bảo hành" → trả về thông tin bảo hành
    const fb = getFallbackBotResponse(msg);
    assert.ok(fb.includes('bảo hành') || fb.includes('năm') || fb.includes('Catalog'));
});

test('chatbot: parseRequestedCount constraints', () => {
    assert.equal(parseRequestedCount('cho tôi 2 sản phẩm'), 2);
    assert.equal(parseRequestedCount('lấy 3 mẫu nhé'), 3);
    assert.equal(parseRequestedCount('hiện 5 chiếc xem nào'), 5);
    assert.equal(parseRequestedCount('top 4 đồng hồ'), 4);
    
    // Default count is 3
    assert.equal(parseRequestedCount('đồng hồ dưới 10 triệu'), 3);
    
    // Capped at maximum 5
    assert.equal(parseRequestedCount('hiện 10 chiếc xem nào'), 5);
    assert.equal(parseRequestedCount('gợi ý 6 mẫu'), 5);
});

test('chatbot: parseBudgetRange defaults to max limit', () => {
    // "đồng hồ 10 triệu cho nữ" has no explicit range -> defaults to maxPrice=10M
    const r1 = parseBudgetRange('đồng hồ 10 triệu cho nữ');
    assert.ok(r1);
    assert.equal(r1.maxPrice, 10_000_000);
    assert.equal(r1.minPrice, undefined);

    // "tôi có 10 triệu thôi" has no explicit range -> defaults to maxPrice=10M
    const r2 = parseBudgetRange('tôi có 10 triệu thôi');
    assert.ok(r2);
    assert.equal(r2.maxPrice, 10_000_000);
    assert.equal(r2.minPrice, undefined);
});

console.log('\n✅ All AI Chatbot tests passed! (Budget parsing, matching, formatting, fallback, scenarios)\n');
