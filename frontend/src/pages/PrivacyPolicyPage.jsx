import PolicyPageLayout from "../components/PolicyPageLayout";

const PrivacyPolicyPage = () => {
	return (
		<PolicyPageLayout 
			title="Chính sách bảo mật" 
			description="Cam kết bảo mật thông tin cá nhân khách hàng tại Luxury Watch Store theo tiêu chuẩn quốc tế."
			activeId="privacy"
		>
			<div className="space-y-6 text-gray-600 dark:text-luxury-text-muted">
				<p className="italic">Cập nhật lần cuối: 16 tháng 03, 2026</p>
				
				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">1. Mục đích thu thập thông tin</h3>
					<p>Chúng tôi thu thập thông tin cá nhân của bạn để hỗ trợ quá trình đặt hàng, giao hàng và chăm sóc khách hàng tốt hơn. Các thông tin bao gồm: Họ tên, Email, Số điện thoại, Địa chỉ giao hàng.</p>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">2. Phạm vi sử dụng thông tin</h3>
					<p>Thông tin của bạn sẽ được sử dụng nội bộ cho các mục đích:</p>
					<ul className="list-disc pl-6 space-y-2">
						<li>Xác nhận đơn hàng và liên hệ giao nhận.</li>
						<li>Gửi thông báo về các chương trình khuyến mãi (nếu bạn đăng ký).</li>
						<li>Nâng cao chất lượng dịch vụ và cá nhân hóa trải nghiệm người dùng.</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">3. Cam kết bảo mật</h3>
					<p>Luxury Watch Store cam kết không bán, chia sẻ hay trao đổi thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý của quý khách, ngoại trừ các đơn vị vận chuyển đối tác.</p>
					<p>Chúng tôi sử dụng các công nghệ mã hóa SSL tiêu chuẩn để bảo vệ dữ liệu truyền tải trên hệ thống.</p>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">4. Quyền lợi của khách hàng</h3>
					<p>Quý khách có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất kỳ lúc nào bằng cách đăng nhập vào tài khoản hoặc liên hệ trực tiếp với chúng tôi qua Hotline.</p>
				</section>
			</div>
		</PolicyPageLayout>
	);
};

export default PrivacyPolicyPage;
