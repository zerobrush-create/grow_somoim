# Grow SoMoim API

요청된 엔드포인트(인증/프로필/소모임/클래스/DM/포인트/레퍼럴/스토어/리더보드/광고/어드민)와 WebSocket(`/ws`)를 포함한 Express 기반 서버입니다.

## 실행

```bash
npm install
npm run start
```

기본 포트: `3000`

## 인증

- 기본 사용자: `u1`
- 헤더 `x-user-id`로 사용자 전환 가능
- 어드민 체크가 필요한 API는 `x-user-id: admin` 사용

## WebSocket

- Endpoint: `/ws`
- Join: `{ "type": "join", "room": "group:123" }`
- Leave: `{ "type": "leave", "room": "group:123" }`

## i18n & PWA

- `src/i18n.js`: `useLanguage()`, `t("section.key")`
- `public/manifest.json`
- `public/sw.js`
- `public/install-banner.js`
