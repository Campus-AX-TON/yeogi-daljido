# 배 산지 추천 API v0.1

## 목적

배 주산지의 수확 전 기상 여건을 비교해 Top 3와 대시보드용 근거 데이터를 함께 반환한다.
이 점수는 실제 당도 예측값이 아니라 해커톤용 `산지 기상 적합도`다.

## Endpoint

`GET /api/recommendations/pear?date=2026-08-25`

- `date`: 추천 기준일, `YYYY-MM-DD`. 생략하면 한국 날짜 기준 오늘.
- `mode=auto`: API key가 있으면 기상청 실측, 없으면 UI 개발용 합성 데이터. 기본값.
- `mode=live`: 반드시 기상청 실측 자료를 사용하며 key가 없으면 `503`.
- `mode=demo`: API key와 관계없이 합성 데이터 사용.

응답의 `source.status`가 `live`인지 `demo`인지 UI에 반드시 표시한다.
요청 기준일의 자료가 아직 없으면 최대 2년 전까지 같은 기간의 실측 자료를 찾고,
대체한 경우 `source.note`와 `source.fallbackYears`로 화면에 명시한다.

## 호출 제한과 캐시

- 프론트엔드는 성공한 조회 뒤 60초 동안 배 버튼과 다시 조회 버튼을 비활성화한다.
- 추천 엔진은 같은 날짜·모드의 결과를 서버 인스턴스 메모리에 30분간 보관한다.
- 같은 요청이 동시에 들어오면 진행 중인 Promise를 공유해 기상청 호출을 한 번만 수행한다.
- Vercel은 브라우저 캐시 15분, CDN 캐시 6시간과 stale-while-revalidate 24시간을 사용한다.
- 응답의 `cache.status`와 `x-pear-cache` 헤더는 `miss`, `hit`, `shared` 중 하나다.

## 후보 산지

기상청 2026-01-05 작물별 농업주산지 지역코드표에서 배(`PA160101`)로 확인한 지역 중,
공식 자료에서 주요 산지로 반복 확인되는 5곳을 1차 후보로 사용한다.

| 지역 | AREA_ID |
| --- | --- |
| 평택 | `4122000000` |
| 천안 | `4413100000` |
| 아산 | `4420000000` |
| 안성 | `4155000000` |
| 상주 | `4725000000` |

## 추천 규칙

관측 구간은 기준일 14일 전부터 3일 전까지다. 같은 지역·같은 날짜 구간의 직전 3개년 평균을 평년 기준으로 사용한다.

| 기준 | 배점 | 계산 |
| --- | ---: | --- |
| 평년 대비 일조 | 60 | 평년 수준 45점, 평년 대비 ±20%에서 약 ±15점 |
| 고온 위험 | 25 | 31℃ 이상인 날마다 5점 감점 |
| 강수 급변 위험 | 15 | 강수 평년비 150%/250%와 특보 일수에 따라 감점 |

가중치는 연구에서 추정된 계수가 아니라 제품용 초기 규칙이다. 화면에는 총점과 세부 점수를 같이 노출한다.

## 대시보드 데이터

- `recommendations`: 상위 3개 산지와 추천 문장
- `candidates`: 비교한 전체 산지
- `dashboard.charts`: 일조 평년비, 고온일, 누적 강수, 점수 구성 차트 데이터
- `metrics`: 실측값과 평년 비교값
- `confidence`: 현재 근거 수준
- `availability`: 산지공판장 출하 API 연결 상태

## Vercel 배포

현재 운영 배포는 Vercel을 사용한다. Vercel Project Settings의 Environment Variables에
`DATA_GO_KR_SERVICE_KEY`를 Sensitive 값으로 등록한다. 공공데이터포털에서 새로 발급한 일반인증키 중 `Decoding` 값을 사용한다.
환경변수 변경은 기존 배포에 자동 반영되지 않으므로 등록 후 재배포한다.

Vercel은 루트 `api/` 디렉터리를 Function으로 배포하므로 별도 Cloudflare Worker는 필요하지 않다.
`/api/recommendations/pear`는 Vercel Function에서 동일한 추천 엔진을 호출하고,
`/api/health`는 키 설정 여부만 반환한다. 키가 없는 로컬·Preview 환경은 자동으로 demo 응답을 반환한다.

Cloudflare Worker용 진입점은 Sites 호환 배포를 위해 유지하지만 현재 Vercel 운영 경로에서는 사용하지 않는다.

로컬 `npm run dev`에서도 Vite middleware가 같은 추천 엔진과 `.env.local`의 키를 사용하므로,
배포하지 않고 `/api/recommendations/pear` 실측 호출을 확인할 수 있다.
웹을 열지 않고 연결과 Top 3만 확인할 때는 `npm run check:api`를 실행한다.
특정 기준일은 `npm run check:api -- 2026-08-18`처럼 전달할 수 있다.

## 다음 단계

한국농수산식품유통공사의 산지공판장 거래 API를 추가해 품종·원산지·최근 거래량을 확인한다.
출하가 확인되지 않은 지역은 날씨가 좋아도 `기상 유리/출하 미확인`으로 표시한다.
