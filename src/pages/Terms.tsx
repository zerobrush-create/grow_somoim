import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "제1조 (목적)",
    content: `본 약관은 GROW(이하 "회사")가 운영하는 소모임·클래스 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (용어의 정의)",
    content: `① "서비스"란 회사가 제공하는 소모임 탐색·참여, 클래스 수강, 채팅, 포인트 등 일체의 서비스를 말합니다.\n② "이용자"란 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.\n③ "회원"이란 회사와 서비스 이용 계약을 체결하고 아이디를 부여받은 자를 말합니다.\n④ "포인트"란 서비스 내에서 특정 활동 보상으로 지급되며 가맹점 결제에 사용 가능한 가상의 재화를 말합니다.`,
  },
  {
    title: "제3조 (약관의 효력 및 변경)",
    content: `① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.\n② 회사는 합리적인 사유가 있을 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이후에 효력이 발생합니다.\n③ 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.`,
  },
  {
    title: "제4조 (서비스 제공)",
    content: `① 회사는 다음과 같은 서비스를 제공합니다.\n  - 소모임 탐색, 개설 및 참여\n  - 원데이 클래스 탐색 및 수강 신청\n  - 그룹·개인 채팅\n  - 포인트 적립 및 가맹점 결제\n  - 커뮤니티 게시판, 사진첩, 이벤트 관리\n② 서비스는 연중무휴 24시간 제공함을 원칙으로 하며, 시스템 점검 등 필요한 경우 예외적으로 중단될 수 있습니다.`,
  },
  {
    title: "제5조 (회원가입 및 탈퇴)",
    content: `① 이용자는 회사가 정한 가입 절차에 따라 이용 신청을 하며, 회사가 이를 승낙하면 회원가입이 완료됩니다.\n② 가입 시 이메일 인증을 완료해야 서비스를 이용할 수 있습니다.\n③ 회원은 언제든지 서비스 내 '회원 탈퇴' 기능을 통해 탈퇴를 신청할 수 있으며, 회사는 즉시 처리합니다.\n④ 탈퇴 시 미사용 포인트는 소멸되며 복구되지 않습니다.`,
  },
  {
    title: "제6조 (포인트)",
    content: `① 포인트는 회원가입 보너스, 친구 초대, 모임 활동 보상 등을 통해 적립됩니다.\n② 포인트는 현금으로 환급되지 않으며, 제휴 가맹점에서만 사용 가능합니다.\n③ 포인트의 유효기간은 마지막 서비스 이용일로부터 1년입니다.\n④ 부정한 방법으로 포인트를 적립한 경우 회사는 포인트를 회수하고 계정을 제한할 수 있습니다.`,
  },
  {
    title: "제7조 (이용자의 의무)",
    content: `이용자는 다음 행위를 하여서는 안 됩니다.\n① 타인의 정보를 도용하거나 허위 정보를 등록하는 행위\n② 서비스를 이용하여 법령 또는 본 약관이 금지하는 행위\n③ 다른 이용자를 희롱, 비방하거나 명예를 훼손하는 행위\n④ 음란물, 폭력적 콘텐츠를 게시·전송하는 행위\n⑤ 서비스의 운영을 방해하는 행위`,
  },
  {
    title: "제8조 (면책조항)",
    content: `① 회사는 천재지변, 불가항력적 사유로 인한 서비스 제공 불가에 대해 책임을 지지 않습니다.\n② 회사는 이용자 간에 발생한 분쟁에 대해 개입 의무가 없으며, 이로 인한 손해에 책임을 지지 않습니다.\n③ 이용자가 게시한 정보의 신뢰성 및 정확성에 대해 회사는 보증하지 않습니다.`,
  },
  {
    title: "제9조 (분쟁 해결)",
    content: `① 서비스 이용과 관련한 분쟁은 대한민국 법률을 준거법으로 합니다.\n② 분쟁이 발생한 경우 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.`,
  },
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">서비스 이용약관</h1>
        </header>

        <div className="px-4 pt-4 pb-12">
          {/* Effective date */}
          <p className="text-xs text-muted-foreground mb-6">시행일: 2025년 1월 1일</p>

          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-sm font-bold text-foreground mb-1.5">{s.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted rounded-2xl">
            <p className="text-xs text-muted-foreground text-center">
              문의: <span className="font-medium text-foreground">support@grow-app.kr</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
