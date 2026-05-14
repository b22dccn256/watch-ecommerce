import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Twitter,
  Wallet,
  Youtube,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import axios from "../lib/axios";

const footerColumns = [
  {
    title: "Danh má»¥c",
    links: [
      ["Äá»“ng há»“ nam", "/category/men"],
      ["Äá»“ng há»“ ná»¯", "/category/women"],
      ["Luxury", "/category/luxury"],
      ["Thá»ƒ thao", "/category/sport"],
      ["ThÆ°Æ¡ng hiá»‡u", "/brands"],
    ],
  },
  {
    title: "Há»— trá»£",
    links: [
      ["Vá» chĂºng tĂ´i", "/about"],
      ["ChĂ­nh sĂ¡ch giao hĂ ng", "/delivery-policy"],
      ["Äá»•i tráº£ vĂ  báº£o hĂ nh", "/warranty"],
      ["HÆ°á»›ng dáº«n chá»n size", "/size-guide"],
      ["Tra cá»©u Ä‘Æ¡n hĂ ng", "/order-lookup"],
      ["LiĂªn há»‡", "/contact"],
    ],
  },
];

const socials = [
  [Facebook, "https://www.facebook.com/HocvienPTIT", "Facebook"],
  [Instagram, "https://www.instagram.com/gdgoc.ptit/", "Instagram"],
  [Twitter, "https://x.com/elonmusk", "X"],
  [Youtube, "https://www.youtube.com/@dhcstech", "YouTube"],
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("Vui lĂ²ng nháº­p email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email khĂ´ng Ä‘Ăºng Ä‘á»‹nh dáº¡ng.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/mail/subscribe", { email });
      toast.success(res.data.message || "ÄÄƒng kĂ½ thĂ nh cĂ´ng");
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ Ä‘Äƒng kĂ½ nháº­n tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="section-divider mt-16 border-t border-black/10 bg-[color:var(--color-surface)] dark:border-white/10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-black/8 py-5 text-xs uppercase tracking-[0.16em] text-secondary dark:border-white/8 sm:justify-between">
          <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[color:var(--color-gold)]" />Miá»…n phĂ­ giao hĂ ng tá»« 2.000.000 Ä‘</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--color-gold)]" />Báº£o máº­t thanh toĂ¡n 100%</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_0.7fr_1fr]"
        >
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-gold)]/35 bg-[color:var(--color-gold)]/10 text-[11px] font-bold text-[color:var(--color-gold)]">
                LW
              </div>
              <div>
                <p className="hero-title text-lg tracking-[0.24em]">LUXURY</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Watch Gallery</p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-secondary">
              Tuyá»ƒn chá»n Ä‘á»“ng há»“ cao cáº¥p tá»« nhá»¯ng thÆ°Æ¡ng hiá»‡u danh tiáº¿ng, káº¿t há»£p tráº£i nghiá»‡m mua sáº¯m tinh gá»n vĂ  dá»‹ch vá»¥ háº­u mĂ£i chuyĂªn nghiá»‡p.
            </p>

            <div className="flex gap-2">
              {socials.map(([Icon, href, label]) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -2 }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-secondary transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] dark:border-white/10"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </section>

          {footerColumns.map((column) => (
            <section key={column.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary">{column.title}</h3>
              <ul className="space-y-3 text-sm text-secondary">
                {column.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="transition hover:text-[color:var(--color-gold)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">LiĂªn há»‡</h3>
            <div className="space-y-3 text-sm text-secondary">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-gold)]" />123 ÄÆ°á»ng ABC, Quáº­n 1, TP.HCM</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[color:var(--color-gold)]" />1900 XXX XXX</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[color:var(--color-gold)]" />info@luxurywatch.vn</p>
              <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-[color:var(--color-gold)]" />Thá»© 2 Ä‘áº¿n Chá»§ nháº­t: 09:00 - 21:00</p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-2 rounded-xl border border-black/10 bg-surface-soft p-3 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Nháº­n Æ°u Ä‘Ă£i má»›i</p>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email cá»§a báº¡n"
                  className="input-base h-10 rounded-full pr-10"
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-gold)] text-black">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </section>
        </motion.div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-black/8 py-6 text-xs text-muted dark:border-white/8 sm:flex-row">
          <p>Â© 2026 Luxury Watch. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4" />
            <Wallet className="h-4 w-4" />
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/privacy-policy" className="transition hover:text-[color:var(--color-gold)]">ChĂ­nh sĂ¡ch báº£o máº­t</Link>
            <span>|</span>
            <Link to="/terms" className="transition hover:text-[color:var(--color-gold)]">Äiá»u khoáº£n</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

