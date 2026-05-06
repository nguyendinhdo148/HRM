import type { Route } from "../../+types/root";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Users, CalendarDays, CircleDollarSign, Building2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lighthouse HRM - Giải pháp quản lý nhân sự toàn diện" },
    { name: "description", content: "Nền tảng quản lý nhân sự, chấm công và tính lương thông minh" },
  ];
}

const HomePage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ================= NAVBAR ================= */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent tracking-wide">
            Lighthouse HRM
          </span>
        </div>

        <div className="flex gap-3">
          <Link to="/sign-in">
            <Button variant="ghost">Đăng nhập</Button>
          </Link>
          {/* <Link to="/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Đăng ký ngay
            </Button>
          </Link> */}
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="flex flex-col items-center text-center px-6 mt-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-3xl leading-tight">
          Quản lý đội ngũ nhân sự <br />
          <span className="bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
            hiệu quả & chuyên nghiệp
          </span>
        </h1>

        <p className="mt-6 text-gray-600 max-w-xl text-lg">
          Tự động hóa quy trình HR, quản lý hồ sơ nhân viên, chấm công và tính lương — tất cả trên một nền tảng duy nhất.
        </p>

        <div className="flex gap-4 mt-8">
          {/* <Link to="/sign-up">
            <Button className="px-6 py-5 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
              Bắt đầu miễn phí
            </Button>
          </Link> */}

          <Link to="/sign-in">
            <Button
              variant="outline"
              className="px-6 py-5 text-base rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Đăng nhập hệ thống
            </Button>
          </Link>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mt-24 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Hồ sơ & Nhân sự</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Quản lý thông tin nhân viên, theo dõi hợp đồng, phòng ban và quy trình onboard/offboard dễ dàng.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
            <CalendarDays className="w-5 h-5 text-cyan-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Chấm công & Nghỉ phép</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Theo dõi thời gian làm việc, quản lý ca làm, và duyệt đơn từ xin nghỉ phép nhanh chóng trực tuyến.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
            <CircleDollarSign className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Tính lương & C&B</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Tự động hóa bảng lương, tính toán thuế, BHXH và quản lý các chính sách đãi ngộ nhân viên chính xác.
          </p>
        </div>
      </section>

      {/* ================= PREVIEW ================= */}
      <section className="mt-24 px-6 flex justify-center">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border shadow-xl bg-white">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
            alt="HRM Dashboard Preview"
            className="w-full h-[500px] object-cover"
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mt-24 text-center px-6">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">
          Sẵn sàng tối ưu hóa quy trình nhân sự?
        </h2>
        <p className="text-gray-600 mb-6">
          Tham gia hệ thống Lighthouse HRM và xây dựng môi trường làm việc tốt hơn ngay hôm nay.
        </p>

        {/* <Link to="/sign-up">
          <Button className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
            Trải nghiệm ngay 🚀
          </Button>
        </Link> */}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-24 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Lighthouse HRM. Đã đăng ký bản quyền.
      </footer>
    </div>
  );
};

export default HomePage;