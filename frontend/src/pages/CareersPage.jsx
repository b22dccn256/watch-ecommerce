import React from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  GraduationCap, 
  Star, 
  Award,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

const PERKS = [
  {
    icon: Star,
    title: "Môi trường Đẳng cấp",
    desc: "Làm việc trong không gian sang trọng, tiếp xúc với những kiệt tác đồng hồ xa xỉ và khách hàng tinh hoa."
  },
  {
    icon: Award,
    title: "Chế độ Đãi ngộ Hấp dẫn",
    desc: "Thu nhập không giới hạn (Lương cứng + Hoa hồng cao), bảo hiểm sức khỏe cao cấp và nhiều đặc quyền khác."
  },
  {
    icon: GraduationCap,
    title: "Đào tạo Chuyên sâu",
    desc: "Được huấn luyện trực tiếp bởi chuyên gia từ các thương hiệu đồng hồ Thụy Sĩ hàng đầu."
  }
];

const JOBS = [
  {
    id: "sale-hn",
    title: "Chuyên viên Tư vấn Bán hàng (Sales Consultant)",
    location: "Tràng Tiền Plaza, Hà Nội",
    type: "Toàn thời gian",
    department: "Kinh doanh",
    desc: "Tư vấn và mang đến trải nghiệm mua sắm xa xỉ cho khách hàng. Yêu cầu ngoại hình khá, giao tiếp tốt, ưu tiên kinh nghiệm bán lẻ cao cấp."
  },
  {
    id: "tech-hcm",
    title: "Kỹ thuật viên Đồng hồ (Watch Technician)",
    location: "Saigon Centre, TP.HCM",
    type: "Toàn thời gian",
    department: "Kỹ thuật & Bảo hành",
    desc: "Thực hiện bảo dưỡng, kiểm tra và sửa chữa đồng hồ cơ học. Yêu cầu am hiểu sâu về bộ máy đồng hồ, tỉ mỉ và trung thực."
  },
  {
    id: "mkt-hcm",
    title: "Chuyên viên Marketing / PR",
    location: "Trụ sở chính, TP.HCM",
    type: "Toàn thời gian",
    department: "Marketing",
    desc: "Lên kế hoạch các chiến dịch truyền thông, tổ chức sự kiện VIP cho khách hàng. Có kinh nghiệm trong ngành hàng xa xỉ là một lợi thế."
  }
];

const CareersPage = () => {
  return (
    <div className="animate-fade-in min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-primary)] pb-20">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=2000"
            alt="Careers Hero"
            className="w-full h-full object-cover opacity-50 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-[color:var(--color-gold)] mb-6 font-bold tracking-widest text-sm uppercase"
          >
            <Briefcase className="w-5 h-5" />
            Tuyển Dụng
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-luxury uppercase tracking-wider mb-6 leading-tight"
          >
            Gia Nhập Đội Ngũ <br />
            <span className="text-[color:var(--color-gold)]">Luxury Watch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[color:var(--color-secondary)] leading-relaxed"
          >
            Chúng tôi luôn tìm kiếm những con người đam mê, tận tâm và mong muốn tạo ra trải nghiệm dịch vụ xuất sắc nhất cho giới tinh hoa.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 mt-10">
        
        {/* Perks Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-luxury uppercase tracking-wider mb-4">
              Lý do chọn chúng tôi
            </h2>
            <p className="text-[color:var(--color-secondary)] max-w-2xl mx-auto">
              Luxury Watch Gallery không chỉ là nơi làm việc, mà là nơi bạn phát triển sự nghiệp đỉnh cao.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PERKS.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[color:var(--color-surface)] p-8 rounded-2xl border border-black/5 dark:border-white/5 hover:border-[color:var(--color-gold)]/50 transition-colors"
                >
                  <div className="w-14 h-14 bg-[color:var(--color-gold)]/10 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-[color:var(--color-gold)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{perk.title}</h3>
                  <p className="text-[color:var(--color-secondary)] leading-relaxed">
                    {perk.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Jobs List Section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold font-luxury uppercase tracking-wider mb-4">
                Vị trí đang mở
              </h2>
              <p className="text-[color:var(--color-secondary)]">
                Trở thành một phần của hệ thống phân phối đồng hồ số 1 Việt Nam.
              </p>
            </div>
            <a 
              href="mailto:hr@luxurywatch.vn"
              className="inline-flex items-center justify-center px-6 py-3 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[color:var(--color-gold)] hover:text-black transition-colors"
            >
              Gửi CV Chung
            </a>
          </div>

          <div className="space-y-4">
            {JOBS.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 lg:p-8 bg-[color:var(--color-surface)] rounded-2xl border border-black/5 dark:border-white/5 hover:border-[color:var(--color-gold)] transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)] text-xs font-bold uppercase tracking-widest rounded">
                      {job.department}
                    </span>
                    <span className="text-xs text-[color:var(--color-secondary)] font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[color:var(--color-gold)] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-[color:var(--color-secondary)] text-sm mb-4 line-clamp-2">
                    {job.desc}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-[color:var(--color-gold)]" />
                    {job.location}
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center lg:flex-col lg:items-end justify-between gap-4">
                  <a 
                    href={`mailto:hr@luxurywatch.vn?subject=Ứng tuyển vị trí ${job.title}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl group-hover:bg-[color:var(--color-gold)] group-hover:text-black transition-colors"
                  >
                    Ứng tuyển <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CareersPage;
