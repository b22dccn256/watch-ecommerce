import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-luxury-dark border-t border-luxury-border">
            <div className="max-w-screen-2xl mx-auto px-6 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl font-bold tracking-luxury text-luxury-gold">LUXURY</span>
                            <span className="text-2xl font-bold tracking-luxury text-white">WATCH</span>
                        </div>
                        <p className="text-luxury-text-muted text-sm leading-relaxed mb-6">
                            Nơi hội tụ những tuyệt tác đồng hồ từ các thương hiệu hàng đầu thế giới.
                            Chất lượng, đẳng cấp và phong cách là những gì chúng tôi mang đến cho bạn.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-luxury-text-light font-semibold mb-4">Danh mục</h3>
                        <ul className="space-y-2">
                            <li><Link to="/category/men" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Đồng hồ nam</Link></li>
                            <li><Link to="/category/women" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Đồng hồ nữ</Link></li>
                            <li><Link to="/category/luxury" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Đồng hồ luxury</Link></li>
                            <li><Link to="/category/sport" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Đồng hồ thể thao</Link></li>
                            <li><Link to="/brands" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Thương hiệu</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="text-luxury-text-light font-semibold mb-4">Hỗ trợ khách hàng</h3>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Về chúng tôi</Link></li>
                            <li><Link to="/shipping" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Chính sách giao hàng</Link></li>
                            <li><Link to="/returns" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Đổi trả & Bảo hành</Link></li>
                            <li><Link to="/size-guide" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Hướng dẫn chọn size</Link></li>
                            <li><Link to="/contact" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300 text-sm">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-luxury-text-light font-semibold mb-4">Thông tin liên hệ</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-luxury-gold mt-0.5 flex-shrink-0" />
                                <span className="text-luxury-text-muted text-sm">123 Đường ABC, Quận 1, TP.HCM</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                                <span className="text-luxury-text-muted text-sm">1900 XXX XXX</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                                <span className="text-luxury-text-muted text-sm">info@luxurywatch.vn</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-4 h-4 text-luxury-gold mt-0.5 flex-shrink-0" />
                                <span className="text-luxury-text-muted text-sm">Mon-Sat: 9AM-9PM<br />Sunday: 10AM-8PM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <div className="border-t border-luxury-border pt-8 pb-6">
                    <div className="max-w-md mx-auto text-center">
                        <h4 className="text-luxury-text-light font-semibold mb-2">Đăng ký nhận tin</h4>
                        <p className="text-luxury-text-muted text-sm mb-4">
                            Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email của bạn"
                                className="flex-1 bg-luxury-darker border border-luxury-border text-luxury-text-light placeholder-luxury-text-muted px-4 py-2 rounded-full text-sm focus:outline-none focus:border-luxury-gold transition duration-300"
                            />
                            <button className="bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-6 py-2 rounded-full text-sm font-medium transition duration-300">
                                Đăng ký
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="border-t border-luxury-border pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-luxury-text-muted text-sm">
                            © 2026 Luxury Watch. Tất cả quyền được bảo lưu.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <Link to="/privacy" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                Chính sách bảo mật
                            </Link>
                            <Link to="/terms" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
                                Điều khoản sử dụng
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;