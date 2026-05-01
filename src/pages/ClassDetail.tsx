import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, Heart, MapPin, Star, User, ThumbsUp } from "lucide-react";
import { classes, classReviews } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "intro" | "reviews";

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const classItem = classes.find((c) => c.id === id) ?? classes[0];
  const reviews = classReviews.filter((r) => r.classId === (id ?? "c1"));

  const [liked, setLiked] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const [reviewLikes, setReviewLikes] = useState<Record<string, boolean>>(
    Object.fromEntries(reviews.map((r) => [r.id, r.liked]))
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : classItem.rating.toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md bg-background relative pb-28">
        {/* Hero image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img src={classItem.image} alt={classItem.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          <div className="absolute top-3 left-0 right-0 px-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
              aria-label="뒤로"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
              aria-label="찜"
            >
              <Heart className={cn("h-5 w-5", liked && "fill-accent text-accent")} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-5">
          <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{classItem.category}</Badge>
          <h1 className="text-xl font-bold mt-2 leading-snug">{classItem.title}</h1>

          {/* Host */}
          <div className="flex items-center gap-2 mt-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">강사</p>
              <p className="text-sm font-semibold">{classItem.host}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {classItem.location}</span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-bold text-foreground">{avgRating}</span>
              <span className="text-xs">({classItem.reviews})</span>
            </span>
          </div>
        </div>

        {/* Price card */}
        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">클래스 참가비</p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {classItem.price.toLocaleString()}<span className="text-sm font-normal">원</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">평점</p>
            <div className="flex items-center gap-1 mt-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(avgRating)) ? "fill-accent text-accent" : "text-muted")} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mt-5">
          {([["intro", "클래스 소개"], ["reviews", `리뷰 ${reviews.length}`]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold border-b-2 transition-smooth",
                activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === "intro" && (
            <div className="px-4 pt-5 pb-4 space-y-5">
              <section>
                <h2 className="text-base font-bold mb-2">클래스 소개</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {classItem.host}와 함께하는 특별한 원데이 클래스입니다. 초보자도 쉽게 따라할 수 있도록 단계별로 친절하게 안내해 드립니다.
                  {"\n\n"}혼자 배우기 어려웠던 것들, 함께라면 더 즐겁고 쉽게 배울 수 있어요. 소중한 경험과 추억을 만들어 가세요!
                </p>
              </section>

              <section>
                <h2 className="text-base font-bold mb-3">클래스 정보</h2>
                <div className="space-y-2">
                  {[
                    ["📍 장소", classItem.location],
                    ["👤 강사", classItem.host],
                    ["⏱ 소요시간", "약 2시간"],
                    ["👥 정원", "최대 8명 (소규모)"],
                    ["🧾 포함사항", "재료비 포함, 완성품 가져가기"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="pt-4 pb-4">
              {/* Rating summary */}
              <div className="px-4 mb-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{avgRating}</p>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(Number(avgRating)) ? "fill-accent text-accent" : "text-muted")} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">리뷰 {reviews.length}개</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5,4,3,2,1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-3 text-muted-foreground">{star}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-border">
                {reviews.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground text-sm px-4">아직 리뷰가 없어요</div>
                )}
                {reviews.map((r) => (
                  <div key={r.id} className="px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {r.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{r.author}</span>
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={cn("h-3 w-3", s <= r.rating ? "fill-accent text-accent" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{r.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{r.content}</p>
                    <button
                      onClick={() => setReviewLikes((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className="flex items-center gap-1 mt-2 text-[12px] text-muted-foreground"
                    >
                      <ThumbsUp className={cn("h-3.5 w-3.5", reviewLikes[r.id] && "fill-primary text-primary")} />
                      <span className={cn(reviewLikes[r.id] && "text-primary font-semibold")}>
                        {r.likes + (reviewLikes[r.id] !== r.liked ? (reviewLikes[r.id] ? 1 : -1) : 0)}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">참가비</span>
            <span className="text-base font-bold">{classItem.price.toLocaleString()}원</span>
          </div>
          <Button
            onClick={() => setEnrolled(!enrolled)}
            className={cn(
              "flex-1 h-12 rounded-xl text-base font-bold border-0 shadow-glow hover:opacity-95",
              enrolled ? "bg-muted text-foreground shadow-none" : "gradient-primary"
            )}
          >
            {enrolled ? "✓ 신청완료" : "수강 신청하기"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;
