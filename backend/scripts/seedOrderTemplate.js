import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/emailTemplate.model.js';
import { orderConfirmationTemplate, welcomeTemplate, abandonedCartTemplate } from '../lib/emailTemplates.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    try {
        await EmailTemplate.findOneAndUpdate(
            { name: 'Xác nhận đơn hàng' },
            {
                name: 'Xác nhận đơn hàng',
                subject: 'Xác nhận đơn hàng #{{order.orderCode}}',
                htmlContent: orderConfirmationTemplate,
                description: 'Mẫu email xác nhận đơn hàng sau khi khách hàng đặt hàng thành công.',
                category: 'transactional',
                isActive: true
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );
        
        await EmailTemplate.findOneAndUpdate(
            { name: 'Chào mừng thành viên' },
            {
                name: 'Chào mừng thành viên',
                subject: 'Chào mừng bạn đến với Luxury Watch Store!',
                htmlContent: welcomeTemplate,
                description: 'Mẫu email gửi khi khách hàng đăng ký nhận tin hoặc tạo tài khoản.',
                category: 'marketing',
                isActive: true
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );

        await EmailTemplate.findOneAndUpdate(
            { name: 'Nhắc nhở giỏ hàng bị bỏ quên' },
            {
                name: 'Nhắc nhở giỏ hàng bị bỏ quên',
                subject: 'Giỏ hàng của bạn đang chờ...',
                htmlContent: abandonedCartTemplate,
                description: 'Mẫu email tự động gửi khi khách hàng thêm sản phẩm vào giỏ nhưng chưa thanh toán.',
                category: 'automation',
                isActive: true
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );

        console.log('All templates seeded successfully.');
    } catch (error) {
        console.error('Error seeding templates:', error);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
});
