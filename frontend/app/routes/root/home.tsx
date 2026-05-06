import type { Route } from "../../+types/root";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Wrench, CheckCircle2, Users, ListCheck } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Botdev789 - Manage your work smarter" },
    { name: "description", content: "Task management platform" },
  ];
}

const HomePage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ================= NAVBAR ================= */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
            botdev789
          </span>
        </div>

        <div className="flex gap-3">
          <Link to="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          {/* <Link to="/sign-up">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Get Started
            </Button>
          </Link> */}
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="flex flex-col items-center text-center px-6 mt-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-3xl leading-tight">
          Manage your tasks <br />
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            faster & smarter
          </span>
        </h1>

        <p className="mt-6 text-gray-600 max-w-xl">
          TaskHub helps you organize work, collaborate with your team, and stay
          productive — all in one place.
        </p>

        <div className="flex gap-4 mt-8">
          {/* <Link to="/sign-up">
            <Button className="px-6 py-5 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
              Get Started Free
            </Button>
          </Link> */}

          <Link to="/sign-in">
            <Button
              variant="outline"
              className="px-6 py-5 text-base rounded-xl"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mt-24 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-white shadow-sm border">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
            <ListCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Task Management</h3>
          <p className="text-gray-600 text-sm">
            Create, organize and track your tasks easily with a clean interface.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white shadow-sm border">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Team Collaboration</h3>
          <p className="text-gray-600 text-sm">
            Work together with your team in real-time and stay aligned.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white shadow-sm border">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5 text-pink-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
          <p className="text-gray-600 text-sm">
            Monitor completed tasks and boost your productivity daily.
          </p>
        </div>
      </section>

      {/* ================= PREVIEW ================= */}
      <section className="mt-24 px-6 flex justify-center">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border shadow-xl bg-white">
          <img
            src="https://projectresources.cdt.ca.gov/wp-content/uploads/sites/50/2017/08/Assigning-Work-with-a-Team-Wall.png"
            alt="TaskHub preview"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mt-24 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">
          Ready to boost your productivity?
        </h2>
        <p className="text-gray-600 mb-6">
          Join TaskHub and start managing your work efficiently today.
        </p>

        {/* <Link to="/sign-up">
          <Button className="px-8 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
            Get Started Now 🚀
          </Button>
        </Link> */}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-24 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} TaskHub. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
