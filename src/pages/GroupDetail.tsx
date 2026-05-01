import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, Heart, MapPin, Users, Calendar, MessageCircle } from "lucide-react";
import { groups } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const group = groups.find((g) => g.id === id) ?? groups[0];
  const [liked, setLiked] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md bg-background relative pb-28">
        {/* Hero image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img src={group.image} alt={group.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          <div className="absolute top-3 left-0 right-0 px-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
              aria-label="뒤로"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                aria-label="찜"
              >
                <Heart className={cn("h-5 w-5", liked && "fill-accent text-accent")} />
              </button>
              <button className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="공유">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-5">
          <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{group.category}</Badge>
          <h1 className="text-2xl font-bold mt-2">{group.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {group.location}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.members}명</span>
          </div>
        </div>

        {/* Stats card */}
        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 grid grid-cols-3 divide-x divide-primary/10">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">멤버</p>
            <p className="text-lg font-bold text-primary mt-0.5">{group.members}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">정모</p>
            <p className="text-lg font-bold text-primary mt-0.5">월 4회</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">활동도</p>
            <p className="text-lg font-bold text-primary mt-0.5">🔥 높음</p>
          </div>
        </div>

        {/* Description */}
        <section className="px-4 pt-6">
          <h2 className="text-base font-bold mb-2">소모임 소개</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {group.description}{"\n\n"}함께 시간을 보내며 성장하고 싶은 분들 모두 환영해요. 부담 없이 가볍게 참여해 보세요!
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {group.tags.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">#{t}</span>
            ))}
          </div>
        </section>

        {/* Upcoming meet */}
        <section className="px-4 pt-6">
          <h2 className="text-base font-bold mb-2">다가오는 정모</h2>
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex flex-col items-center justify-center text-primary-foreground">
                <span className="text-[10px] font-medium leading-none">5월</span>
                <span className="text-base font-bold leading-none mt-0.5">12</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">5월 정기 모임</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> 일요일 오후 2시 · 연남동 카페
                </p>
                <p className="text-xs text-primary font-medium mt-1.5">12명 참여 예정</p>
              </div>
            </div>
          </div>
        </section>

        {/* Members preview */}
        <section className="px-4 pt-6">
          <h2 className="text-base font-bold mb-3">멤버</h2>
          <div className="flex -space-x-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-glow border-2 border-card flex items-center justify-center text-primary-foreground text-xs font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="h-10 w-10 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{group.members - 5}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          <Link
            to="/chat"
            className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-smooth"
            aria-label="문의"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <Button className="flex-1 h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95">
            가입 신청하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;