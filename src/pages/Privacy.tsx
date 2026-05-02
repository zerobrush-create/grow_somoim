import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    content: `회사는 회원가입, 서비스 이용 과정에서 다음의 개인정보를 수집합니다.\n\n[필수 항목]\n- 이메일 주소, 비밀번호, 닉네임\n\n[선택 항목]\n- 프로필 사진, 생년월일, 성별, 거주 지역, MBTI, 관심사, 자기소개\n\n[자동 수집 항목]\n- 서비스 이용 기록, 접속 IP, 기기 정보, 쿠키`,
  },
  {
    title: "2. 개인정보 수집 및 이용 목적",
    content: `① 회원 관리: 본인 확인, 계정 보호, 서비스 공지\n② 서비스 제공: 소모임·클래스 매칭, 채팅, 포인트 관리\n③ 서비스 개선: 통계 분석, 맞춤형 추천, 신규 기능 개발\n④ 마케팅·광고: 이벤트·프로모션 안내 (동의한 경우에 한함)`,
  },
  {
    title: "3. 개인정보 보유 및 이용 기간",
    content: `회원 탈퇴 시 즉시 삭제를 원칙으로 하나, 아래 경우 일정 기간 보존합니다.\n\n- 계약·청약 철회 기록: 5년 (전자상거래법)\n- 소비자 불만·분쟁처리 기록: 3년 (전자상거래법)\n- 접속 로그 기록: 3개월 (통신비밀보호법)\n- 부정 이용 방지를 위한 최소 식별 정보: 6개월`,
  },
  {
    title: "4. 개인정보 제3자 제공",
    content: `회사는 원칙적으로 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 아래 경우는 예외입니다.\n\n- 이용자가 사전에 동의한 경우\n- 법령에 따라 수사기관 등이 적법한 절차에 따라 요청한 경우`,
  },
  {
    title: "5. 개인정보 처리 위탁",
    content: `회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.\n\n- Supabase Inc.: 회원 인증 및 데이터베이스 저장·관리\n- Cloudinary Inc.: 이미지 파일 저장 및 최적화\n- 이메일 발송 업체: 인증 메일, 알림 메일 발송`,
  },
  {
    title: "6. 이용자의 권리",
    content: `이용자는 언제든지 다음의 권리를 행사할 수 있습니다.\n\n① 개인정보 열람 요청\n② 오류 정정 요청\n③ 삭제 요청 (단, 법령에 따라 보존 의무가 있는 경우 제외)\n④ 처리 정지 요청\n\n요청은 서비스 내 '내 정보' 메뉴 또는 이메일(privacy@grow-app.kr)로 접수할 수 있습니다.`,
  },
  {
    title: "7. 쿠키 사용",
    content: `서비스는 로그인 유지, 이용 편의 향상을 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키 수집을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.`,
  },
  {
    title: "8. 개인정보 보호 책임자",
    content: `개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해주세요.\n\n개인정보 보호책임자: 개인정보팀\n이메일: privacy@grow-app.kr\n처리 기간: 접수 후 10영업일 이내`,
  },
  {
    title: "9. 한국 개인정보보호법 관련 권리 안내",
    content: `이용자는 개인정보보호법 제35조에 따라 언제든지 자신의 개인정보를 열람할 수 있으며, 동법 제36조에 따라 정정·삭제를 요청할 수 있습니다. 또한 동법 제37조에 따라 처리 정지를 요청할 권리가 있습니다.\n\n회원 탈퇴 및 개인정보 삭제는 서비스 내 '내 정보 → 설정 → 회원 탈퇴'를 통해 즉시 처리할 수 있습니다.`,
  },
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">개인정보처리방침</h1>
        </header>

        <div className="px-4 pt-4 pb-12">
          <p className="text-xs text-muted-foreground mb-2">시행일: 2025년 1월 1일</p>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            GROW(이하 "회사")는 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리하기 위해 다음과 같은 방침을 수립·공개합니다.
          </p>

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
              문의: <span className="font-medium text-foreground">privacy@grow-app.kr</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
