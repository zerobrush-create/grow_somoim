import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, Heart, MapPin, Users, Calendar, MessageCircle, ThumbsUp, MessageSquare, Pin, Image, Bell, CheckCircle } from "lucide-react";
import {
  groups, events, boardPosts, groupPhotos, announcements,
  type Group, type GroupEvent, type BoardPost, type GroupPhoto, type Announcement,
} from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "intro" | "events" | "board" | "photos" | "notices";
type EventStatus = "attending" | "not_attending" | "maybe" | null;

const tabs: { id: Tab; label: string }[] = [
  { id: "intro", label: "소개" },
  { id: "events", label: "이벤트" },
  { id: "board", label: "게시판" },
  { id: "photos", label: "사진첩" },
  { id: "notices", label: "공지" },
];

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const group: Group = groups.find((g) => g.id === id) ?? groups[0];
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("intro");

  const groupId = group.id;
  const groupEvents = events.filter((e) => e.groupId === groupId);
  const posts = boardPosts.filter((p) => p.groupId === groupId);
  const photos = groupPhotos.filter((p) => p.groupId === groupId);
  const notices = announcements.filter((a) => a.groupId === groupId);

  const [postLikes, setPostLikes] = useState<Record<string, boolean>>(
    Object.fromEntries(posts.map((p) => [p.id, p.liked]))
  );
  const [eventStatuses, setEventStatuses] = useState<Record<string, EventStatus>>(
    Object.fromEntries(groupEvents.map((e) => [e.id, e.myStatus]))
  );

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

        {/* Tab bar */}
        <div className="flex border-b border-border mt-5 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-smooth",
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "intro" && <IntroTab group={group} />}
          {activeTab === "events" && (
            <EventsTab
              events={groupEvents}
              statuses={eventStatuses}
              onStatusChange={(eid, status) =>
                setEventStatuses((prev) => ({ ...prev, [eid]: status }))
              }
            />
          )}
          {activeTab === "board" && (
            <BoardTab
              posts={posts}
              likes={postLikes}
              onLike={(pid) => setPostLikes((prev) => ({ ...prev, [pid]: !prev[pid] }))}
            />
          )}
          {activeTab === "photos" && <PhotosTab photos={photos} />}
          {activeTab === "notices" && <NoticesTab notices={notices} />}
        </div>
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

/* ── 소개 탭 ── */
const IntroTab = ({ group }: { group: Group }) => (
  <>
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

    <section className="px-4 pt-6">
      <h2 className="text-base font-bold mb-2">다가오는 정모</h2>
      <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex flex-col items-center justify-center text-primary-foreground">
            <span className="text-[10px] font-medium leading-none">5월</span>
            <span className="text-base font-bold leading-none mt-0.5">10</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">5월 정기 모임</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> 토요일 오후 2시 · 연남동 카페
            </p>
            <p className="text-xs text-primary font-medium mt-1.5">12명 참여 예정</p>
          </div>
        </div>
      </div>
    </section>

    <section className="px-4 pt-6 pb-4">
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
  </>
);

/* ── 이벤트 탭 ── */
const EventsTab = ({
  events,
  statuses,
  onStatusChange,
}: {
  events: GroupEvent[];
  statuses: Record<string, EventStatus>;
  onStatusChange: (id: string, status: EventStatus) => void;
}) => (
  <div className="px-4 pt-4 space-y-3 pb-4">
    {events.length === 0 && (
      <div className="text-center py-16 text-muted-foreground text-sm">아직 이벤트가 없어요</div>
    )}
    {events.map((ev) => {
      const status = statuses[ev.id];
      const dateParts = ev.date.split(" ");
      return (
        <div key={ev.id} className="bg-card rounded-2xl p-4 shadow-soft border border-border">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl gradient-primary flex flex-col items-center justify-center text-primary-foreground flex-shrink-0">
              <span className="text-[10px] font-medium leading-none">{dateParts[0]}</span>
              <span className="text-base font-bold leading-none mt-0.5">{dateParts[1]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {ev.type === "special" && (
                  <Badge className="bg-accent-soft text-accent border-0 text-[10px] py-0">특별</Badge>
                )}
                <p className="text-sm font-bold">{ev.title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {ev.time} · {ev.location}
              </p>
              <p className="text-xs text-primary font-medium mt-1">{ev.attendees}명 참여 예정</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {(["attending", "maybe", "not_attending"] as const).map((s) => {
              const labels = { attending: "✓ 참여", maybe: "? 미정", not_attending: "✕ 불참" };
              const activeClass =
                s === "attending" ? "bg-primary text-primary-foreground" :
                s === "maybe" ? "bg-secondary text-secondary-foreground" :
                "bg-muted text-foreground";
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(ev.id, status === s ? null : s)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-smooth",
                    status === s ? activeClass : "bg-muted text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

/* ── 게시판 탭 ── */
const BoardTab = ({
  posts,
  likes,
  onLike,
}: {
  posts: BoardPost[];
  likes: Record<string, boolean>;
  onLike: (id: string) => void;
}) => (
  <div className="pt-4 pb-4 divide-y divide-border">
    {posts.length === 0 && (
      <div className="text-center py-16 text-muted-foreground text-sm px-4">아직 게시글이 없어요</div>
    )}
    {posts.map((post) => (
      <div key={post.id} className="px-4 py-4">
        {post.isPinned && (
          <div className="flex items-center gap-1 text-primary text-[11px] font-semibold mb-1.5">
            <Pin className="h-3 w-3" /> 공지
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold">
            {post.authorInitial}
          </div>
          <span className="text-xs font-semibold">{post.author}</span>
          <span className="text-[11px] text-muted-foreground ml-auto">{post.time}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1 text-[12px] text-muted-foreground transition-smooth"
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", likes[post.id] && "fill-primary text-primary")} />
            <span className={cn(likes[post.id] && "text-primary font-semibold")}>
              {post.likes + (likes[post.id] !== post.liked ? (likes[post.id] ? 1 : -1) : 0)}
            </span>
          </button>
          <button className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{post.comments}</span>
          </button>
        </div>
      </div>
    ))}
  </div>
);

/* ── 사진첩 탭 ── */
const PhotosTab = ({ photos }: { photos: GroupPhoto[] }) => (
  <div className="px-4 pt-4 pb-4">
    {photos.length === 0 && (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <Image className="h-10 w-10 mx-auto mb-2 opacity-30" />
        아직 사진이 없어요
      </div>
    )}
    <div className="grid grid-cols-3 gap-1.5">
      {photos.map((p) => (
        <button key={p.id} className="aspect-square rounded-xl overflow-hidden bg-muted transition-smooth hover:opacity-90 active:scale-95">
          <img src={p.image} alt={p.author} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  </div>
);

/* ── 공지 탭 ── */
const NoticesTab = ({ notices }: { notices: Announcement[] }) => (
  <div className="px-4 pt-4 pb-4 space-y-3">
    {notices.length === 0 && (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
        공지사항이 없어요
      </div>
    )}
    {notices.map((n) => (
      <div key={n.id} className={cn("bg-card rounded-2xl p-4 shadow-soft border", n.important ? "border-primary/30" : "border-border")}>
        <div className="flex items-start gap-2">
          {n.important && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">{n.title}</p>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">{n.time}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{n.content}</p>
            <p className="text-[11px] text-primary font-medium mt-2">{n.author}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default GroupDetail;
