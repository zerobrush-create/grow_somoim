# Grow Somoim Design System v1

## 1) 브랜드 컬러 추출 (로고 기반)
로고의 메인 그린을 기준색으로 잡고, 서비스 전반의 톤을 "Fresh Community" 컨셉으로 재구성했습니다.

- **Primary Seed**: `#148E45` (로고의 중심 그린)
- 성격: 신뢰감, 성장, 활력, 로컬 커뮤니티의 생동감

### Core Palette
- `brand-50` `#EFFBF4`
- `brand-100` `#D8F5E4`
- `brand-200` `#B2EBCB`
- `brand-300` `#81DDA9`
- `brand-400` `#4FCA84`
- `brand-500` `#148E45` (메인)
- `brand-600` `#117A3C`
- `brand-700` `#0D612F`
- `brand-800` `#094B24`
- `brand-900` `#053117`

### Semantic Colors
- Surface
  - `surface-base`: `#F4F8F5`
  - `surface-elevated`: `#FFFFFF`
  - `surface-muted`: `#E6EFE9`
  - `surface-inverse`: `#0B1F14`
- Text
  - `text-primary`: `#102217`
  - `text-secondary`: `#3E5446`
  - `text-tertiary`: `#6B8172`
  - `text-inverse`: `#ECF7F0`
- Border
  - `border-soft`: `#D3E2D8`
  - `border-strong`: `#8EAB99`
- Accent
  - `accent-mint`: `#3BCB8A`
  - `accent-sky`: `#3EA6FF`
  - `accent-amber`: `#FFB547`
  - `accent-coral`: `#FF7A59`

---

## 2) 타이포그래피 시스템
커뮤니티 앱 특성상 가독성과 밀도 균형이 중요하므로 본문은 Pretendard 중심, 헤드라인은 Space Grotesk를 보조 사용합니다.

### Font Stack
- **Display**: `Space Grotesk`, `Pretendard`, `sans-serif`
- **Body/UI**: `Pretendard`, `Inter`, `system-ui`, `sans-serif`

### Type Scale
- `Display-L` : 36/44, 700
- `Display-M` : 30/38, 700
- `Title` : 24/32, 600
- `Heading` : 20/28, 600
- `Body-L` : 18/30, 400
- `Body` : 16/28, 400
- `Body-S` : 14/22, 400
- `Caption` : 12/18, 500
- `Overline` : 11/16, 600, +0.08em

---

## 3) 주요 컴포넌트 스타일 가이드

### 버튼 (Button)
- Radius: 12px (`rounded-xl`)
- Height: 기본 42px
- 기본 상태: 강한 대비 + 명확한 그림자/포커스

Variants
- **Primary**: `bg-brand-500`, hover `brand-600`
- **Secondary**: `bg-surface-elevated` + `border-soft`
- **Ghost**: 투명 배경 + `text-brand-600`

### 카드 (Card)
- Radius: 24px (`rounded-2xl`)
- Border: `1px border-soft`
- Background: `surface-elevated`
- Shadow: `0 8px 24px rgba(16, 34, 23, 0.08)`

### 인풋 (Input)
- Radius: 12px
- Border: `border-soft`
- Focus: `brand-500` + 소프트 링
- Placeholder: `text-tertiary`

### 배지 (Badge)
- Shape: Pill (`rounded-full`)
- Size: 12px text + compact padding
- Variants: `badge-brand`, `badge-muted`

### 탭 (Tab)
- 비활성: `text-secondary`, underline 없음
- 활성: `text-brand-600` + bottom border `brand-500`
- 인터랙션: 부드러운 색 전환(200ms)

---

## 4) 다크모드 전략
**지원함 (class 기반).**

선택 이유:
1. 소모임 앱은 야간 사용량이 높아 가독성/피로도 대응 필요.
2. 커뮤니티 피드 UI 특성상 다크모드 선호 사용자 비율이 높음.
3. 초기부터 토큰 기반 설계 시 유지보수 비용이 낮음.

구현 방식:
- Tailwind `darkMode: 'class'`
- CSS 변수 토큰을 `:root` / `.dark`로 분기
- 컴포넌트는 semantic token만 참조

---

## 5) 구현 파일
- `tailwind.config.ts`: 커스텀 컬러, 폰트, 쉐도우, 라운드 정의
- `src/styles/design-system.css`: base + 컴포넌트 레이어 정의

이 상태에서 바로 화면 단위(`Home`, `MeetupDetail`, `Chat`) UI를 일관된 톤으로 확장 가능합니다.
