// lib/emailTemplates.js

export const welcomeTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chào mừng đến với Luxury Watch</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 40px 20px; text-align: center; border-bottom: 3px solid #d4af37; }
        .header h1 { color: #d4af37; margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: 300; text-transform: uppercase; }
        .header p { color: #cccccc; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #333333; }
        .content h2 { color: #1a1a1a; font-size: 28px; margin-top: 0; font-weight: 300; border-left: 4px solid #d4af37; padding-left: 15px; }
        .content p { line-height: 1.8; font-size: 16px; margin-bottom: 20px; color: #555555; }
        .features { background-color: #fafafa; border-radius: 8px; padding: 25px; margin: 30px 0; }
        .features h3 { margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 400; }
        .features ul { list-style: none; padding: 0; }
        .features li { padding: 8px 0 8px 30px; background: url('https://cdn-icons-png.flaticon.com/512/190/190411.png') left center no-repeat; background-size: 20px; color: #555555; }
        .button { display: inline-block; background-color: #d4af37; color: #1a1a1a; text-decoration: none; padding: 14px 40px; border-radius: 40px; font-weight: 600; font-size: 16px; margin: 20px 0; letter-spacing: 1px; text-transform: uppercase; transition: background-color 0.3s ease; border: 1px solid #d4af37; }
        .button:hover { background-color: #b8960f; border-color: #b8960f; }
        .contact-info { background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0 10px; text-align: center; }
        .contact-info p { margin: 5px 0; }
        .footer { background-color: #1a1a1a; padding: 30px 20px; text-align: center; color: #888888; font-size: 14px; }
        .footer .unsubscribe { margin-top: 20px; font-size: 12px; color: #666666; }
        .footer .unsubscribe a { color: #d4af37; text-decoration: none; }
        hr { border: none; border-top: 1px solid #eaeaea; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>LUXURY WATCH</h1><p>Since 2026</p></div>
        <div class="content">
            <h2>Kính chào {{fullName}},</h2>
            <p>Chúng tôi rất vui mừng được chào đón bạn trở thành thành viên chính thức của <strong>Luxury Watch</strong> – nơi hội tụ những tuyệt tác đồng hồ danh tiếng nhất thế giới.</p>
            <p>Tài khoản của bạn đã được kích hoạt thành công với email <strong>{{email}}</strong>. Từ nay, bạn có thể tận hưởng những đặc quyền dành riêng cho giới sành đồng hồ:</p>
            <div class="features">
                <h3>✦ Đặc quyền thành viên</h3>
                <ul>
                    <li>Khám phá bộ sưu tập giới hạn (Limited Edition)</li>
                    <li>Lưu danh sách yêu thích không giới hạn</li>
                    <li>Theo dõi đơn hàng theo thời gian thực</li>
                    <li>Nhận ưu đãi đặc biệt và thông tin sản phẩm mới nhất</li>
                    <li>Hỗ trợ tư vấn cá nhân hóa từ đội ngũ chuyên gia</li>
                </ul>
            </div>
            <div style="text-align: center;"><a href="{{shopUrl}}" class="button">KHÁM PHÁ BỘ SƯU TẬP</a></div>
            <div class="contact-info">
                <p>📧 <a href="mailto:concierge@luxurywatch.vn" style="color: #d4af37;">concierge@luxurywatch.vn</a></p>
                <p>📞 1900 XXX XXX (Miễn phí 24/7)</p>
            </div>
            <p>Trân trọng,<br><strong>Đội ngũ Luxury Watch</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Luxury Watch. Tất cả các quyền được bảo lưu.</p>
            <p class="unsubscribe">Nếu không muốn nhận thêm thông tin, bạn có thể <a href="{{unsubscribeLink}}">hủy đăng ký tại đây</a>.</p>
        </div>
    </div>
    <img src="{{trackingPixel}}" width="1" height="1" alt="" style="display:none;">
</body>
</html>
`;

export const orderConfirmationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Xác nhận đơn hàng</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333; margin: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 30px; border-radius: 8px; }
        .header { border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
        .order-info { background: #f9f9f9; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
        .total { font-size: 18px; font-weight: bold; color: #d4af37; text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #d4af37; margin: 0;">LUXURY WATCH</h1>
            <p>Xác nhận đơn hàng #{{order.orderCode}}</p>
        </div>
        <div class="content">
            <p>Chào bạn,</p>
            <p>Cảm ơn bạn đã đặt hàng tại Luxury Watch. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến bạn.</p>
            <div class="order-info">
                <strong>Thông tin giao hàng:</strong><br>
                {{order.shippingDetails.name}}<br>
                {{order.shippingDetails.address}}<br>
                {{order.shippingDetails.city}}<br>
                SĐT: {{order.shippingDetails.phoneNumber}}
            </div>
            <p><strong>Phương thức thanh toán:</strong> {{order.paymentMethod}}</p>
            <p class="total">Tổng cộng: {{order.totalAmount}} VND</p>
            <p>Bạn có thể tra cứu trạng thái đơn hàng bất cứ lúc nào tại website của chúng tôi.</p>
        </div>
    </div>
    <img src="{{trackingPixel}}" width="1" height="1" alt="" style="display:none;">
</body>
</html>
`;

export const abandonedCartTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giỏ hàng của bạn đang chờ</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #d4af37; }
        .header h1 { color: #d4af37; margin: 0; font-size: 32px; letter-spacing: 3px; font-weight: 300; text-transform: uppercase; }
        .content { padding: 40px 30px; color: #333333; }
        .content h2 { color: #1a1a1a; font-size: 24px; margin-top: 0; font-weight: 300; border-left: 4px solid #d4af37; padding-left: 15px; }
        .product-list { background-color: #fafafa; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .product-item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eaeaea; }
        .product-item:last-child { border-bottom: none; }
        .product-image { width: 70px; height: 70px; border-radius: 8px; margin-right: 15px; overflow: hidden; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; }
        .product-details { flex: 1; }
        .product-name { font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
        .product-price { color: #d4af37; font-weight: 500; }
        .button { display: inline-block; background-color: #d4af37; color: #1a1a1a; text-decoration: none; padding: 14px 40px; border-radius: 40px; font-weight: 600; font-size: 16px; margin: 20px 0; letter-spacing: 1px; text-transform: uppercase; transition: background-color 0.3s ease; border: 1px solid #d4af37; }
        .button:hover { background-color: #b8960f; border-color: #b8960f; }
        .footer { background-color: #1a1a1a; padding: 30px 20px; text-align: center; color: #888888; font-size: 14px; }
        .footer .unsubscribe { margin-top: 20px; font-size: 12px; color: #666666; }
        .footer .unsubscribe a { color: #d4af37; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>LUXURY WATCH</h1></div>
        <div class="content">
            <h2>Chào {{fullName}},</h2>
            <p>Chúng tôi nhận thấy bạn vẫn còn những tuyệt tác đồng hồ trong giỏ hàng. Đừng để chúng lỡ hẹn với bạn!</p>
            <div class="product-list">
                <h3 style="margin-top:0; color:#1a1a1a;">Sản phẩm trong giỏ:</h3>
                {{#each cartItems}}
                <div class="product-item">
                    <div class="product-image"><img src="{{this.image}}" alt="{{this.name}}"></div>
                    <div class="product-details">
                        <div class="product-name">{{this.name}}</div>
                        <div class="product-price">{{this.price}} VNĐ</div>
                    </div>
                </div>
                {{/each}}
            </div>
            <p style="text-align: center;"><a href="{{cartUrl}}" class="button">THANH TOÁN NGAY</a></p>
            <p>Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn qua <a href="mailto:concierge@luxurywatch.vn" style="color:#d4af37;">concierge@luxurywatch.vn</a>.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Luxury Watch. Tất cả các quyền được bảo lưu.</p>
            <p class="unsubscribe"><a href="{{unsubscribeLink}}">Hủy nhận email thông báo</a></p>
        </div>
    </div>
    <img src="{{trackingPixel}}" width="1" height="1" alt="" style="display:none;">
</body>
</html>
`;

export const adminNotificationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.5; color: #333; }
        .box { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #fcfcfc; }
        .label { font-weight: bold; color: #666; }
    </style>
</head>
<body>
    <div class="box">
        <h2 style="color: #d4af37;">Thông báo hệ thống mới</h2>
        <p>Có một yêu cầu mới từ khách hàng:</p>
        <hr>
        <p><span class="label">Loại:</span> {{type}}</p>
        <p><span class="label">Từ:</span> {{contact.name}} ({{contact.email}})</p>
        <p><span class="label">SĐT:</span> {{contact.phone}}</p>
        <p><span class="label">Chủ đề:</span> {{contact.subject}}</p>
        <p><span class="label">Nội dung:</span></p>
        <div style="background: #fff; padding: 15px; border-left: 4px solid #d4af37;">{{contact.message}}</div>
    </div>
</body>
</html>
`;
