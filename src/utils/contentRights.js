export const RIGHTS_PATH = "/content-rights/";
export const RIGHTS_SHORT = "무단 복제·재게시 및 AI 학습용 수집을 허용하지 않습니다.";
export const RIGHTS_PARAGRAPHS = [
  "© uiwwsw. 이 안내는 본인이 저작권을 보유한 글과 이미지에 적용됩니다. 개인 열람, 원문 링크 공유, 검색 색인과 제한적인 검색 미리보기를 허용합니다.",
  "사전 서면 허락 없는 원문 또는 실질적인 부분의 복제·재게시·재배포, AI 모델 학습·미세조정 및 학습용 데이터셋 구축 목적의 자동 수집·저장·이용을 허용하지 않습니다.",
  "법령상 허용되는 이용, 기존에 부여된 이용 허락, 별도 라이선스가 적용되는 자료는 해당 범위에 따릅니다. 소스 코드와 제삼자 자료의 기존 라이선스는 변경하지 않습니다.",
];
export const TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot"];
export function renderRobots(siteUrl) {
  return `User-agent: *\nAllow: /\n\n${TRAINING_BOTS.map(bot => `User-agent: ${bot}`).join("\n")}\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
