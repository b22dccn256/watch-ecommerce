import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/emailTemplate.model.js';

dotenv.config();

const birthdayTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Chúc mừng sinh nhật</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; text-align: center; }
        .header { border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 20px; }
        h1 { color: #d4af37; margin: 0; }
        .discount-code { display: inline-block; background: #d4af37; color: #fff; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 4px; margin: 20px 0; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LUXURY WATCH</h1>
            <p>Happy Birthday!</p>
        </div>
        <div class="content">
            <h2>Chúc mừng sinh nhật {{fullName}}!</h2>
            <p>Luxury Watch xin gửi những lời chúc tốt đẹp nhất đến bạn trong ngày đặc biệt này.</p>
            <p>Để tri ân sự ủng hộ của bạn, chúng tôi tặng bạn mã giảm giá 20% áp dụng cho mọi đơn hàng trong tháng sinh nhật của bạn:</p>
            
            <div class="discount-code">HPBD20</div>
            
            <p>Chúc bạn một ngày sinh nhật thật ý nghĩa và hạnh phúc!</p>
        </div>
    </div>
</body>
</html>`;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    try {
        await EmailTemplate.findOneAndUpdate(
            { name: 'Chúc mừng sinh nhật' },
            {
                name: 'Chúc mừng sinh nhật',
                subject: 'Chúc mừng sinh nhật {{fullName}}! Tặng bạn mã giảm giá 20%',
                htmlContent: birthdayTemplate,
                description: 'Mẫu email tự động gửi lời chúc vào ngày sinh nhật khách hàng.',
                category: 'automation',
                isActive: true
            },
            { upsert: true, returnDocument: 'after' }
        );

        console.log('Birthday template seeded successfully.');
    } catch (error) {
        console.error('Error seeding templates:', error);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
});
