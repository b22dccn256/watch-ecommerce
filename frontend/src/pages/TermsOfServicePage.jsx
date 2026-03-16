import PolicyPageLayout from "../components/PolicyPageLayout";

const TermsOfServicePage = () => {
	return (
		<PolicyPageLayout 
			title="Điều khoản sử dụng" 
			description="Các quy định và thỏa thuận người dùng khi tham gia mua sắm tại hệ thống Luxury Watch Store."
			activeId="terms"
		>
			<div className="space-y-6 text-gray-600 dark:text-luxury-text-muted">
				<p>Chào mừng bạn đến với Luxury Watch Store. Khi bạn sử dụng website của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây.</p>
				
				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">1. Quyền sở hữu trí tuệ</h3>
					<p>Toàn bộ nội dung trên website bao gồm hình ảnh, video, logo, văn bản và thiết kế giao diện đều thuộc quyền sở hữu của Luxury Watch Store. Mọi hành vi sao chép, phổ biến khi chưa được phép là vi phạm pháp luật.</p>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">2. Trách nhiệm người dùng</h3>
					<p>Người dùng cam kết cung cấp thông tin chính xác khi đặt hàng. Chúng tôi không chịu trách nhiệm trong trường hợp đơn hàng không được giao thành công do thông tin cung cấp sai lệch.</p>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">3. Chính sách giá cả</h3>
					<p>Giá niêm yết trên website là giá đã bao gồm VAT. Chúng tôi có quyền thay đổi giá sản phẩm bất kỳ lúc nào tùy theo biến động thị trường mà không cần thông báo trước.</p>
				</section>

				<section className="space-y-4">
					<h3 className="text-xl font-bold text-black dark:text-white">4. Giải quyết tranh chấp</h3>
					<p>Mọi tranh chấp phát sinh trong quá trình mua bán sẽ được ưu tiên giải quyết thông qua thương lượng. Trong trường hợp không đạt được thỏa thuận, vụ việc sẽ được đưa ra cơ quan có thẩm quyền xử lý theo pháp luật Việt Nam.</p>
				</section>
			</div>
		</PolicyPageLayout>
	);
};

export default TermsOfServicePage;
