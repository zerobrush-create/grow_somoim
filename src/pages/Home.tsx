import { Link } from "react-router-dom";
import { Search, Bell, MapPin, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { categories, groups } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/grow-logo.png";

const Home = () => {
  const recommended = groups.slice(0, 4);
  const hot = groups.filter((g) => g.hot);

  return (
    <MobileShell>
      {/* Header */}
      <header className="sticky top-0 z-30 gradient-hero pt-3 pb-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GROW" className="h-9 w-9 rounded-full shadow-soft" />
            <div>
              <p className="text-xs text-muted-foreground leading-none">내 위치</p>
              <p className="text-sm font-bold flex items-center gap-1 leading-tight mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                서울 마포구 연남동
              </p>
            </div>
          </div>
          <button className="relative p-2 rounded-full hover:bg-card transition-smooth" aria-label="알림">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          </button>
        </div>

        <Link
          to="/groups"
          className="flex items-center gap-2 bg-card rounded-2xl px-4 py-3 shadow-soft transition-smooth hover:shadow-card"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">관심있는 소모임을 찾아보세요</span>
        </Link>
      </header>

      {/* Hero banner */}
      <section className="px-4 pt-5">
        <div className="gradient-primary rounded-2xl p-5 text-primary-foreground shadow-glow relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-8 bottom-2 h-14 w-14 rounded-full bg-white/10" />
          <div className="relative">
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 mb-2">NEW</Badge>
            <h2 className="text-xl font-bold leading-tight">
              오늘, 새로운 인연을<br />만나보세요 🌱
            </h2>
            <p className="text-sm text-white/90 mt-1.5">취향이 맞는 사람들과 함께 성장해요</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pt-6">
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                to="/groups"
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`h-14 w-14 rounded-full ${c.bg} flex items-center justify-center transition-smooth group-hover:scale-105 group-hover:shadow-soft`}
                >
                  <Icon className={`h-6 w-6 ${c.fg}`} strokeWidth={2} />
                </div>
                <span className="text-[12px] font-medium text-foreground">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recommended */}
      <section className="pt-7">
        <div className="px-4 flex items-end justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-accent" />
              나에게 추천하는 모임
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">관심사 기반으로 골랐어요</p>
          </div>
          <Link to="/groups" className="text-xs text-muted-foreground flex items-center">
            전체 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {recommended.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={g.image} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                <p className="text-sm font-bold mt-0.5 line-clamp-1">{g.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{g.location} · 멤버 {g.members}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot */}
      <section className="px-4 pt-7">
        <div className="flex items-end justify-between mb-3">
          <h3 className="text-lg font-bold flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-accent" />
            지금 뜨는 모임
          </h3>
        </div>
        <div className="space-y-3">
          {hot.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="flex gap-3 bg-card rounded-2xl p-3 shadow-soft transition-smooth hover:shadow-card"
            >
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img src={g.image} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-accent-soft text-[hsl(var(--chip-2-fg))] border-0 text-[10px] py-0">
                    🔥 HOT
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{g.category}</span>
                </div>
                <p className="text-sm font-bold mt-1 line-clamp-1">{g.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{g.location} · 멤버 {g.members}명</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-6" />
    </MobileShell>
  );
};

export default Home;