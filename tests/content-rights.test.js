import test from "node:test";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderRobots, RIGHTS_PATH } from "../src/utils/contentRights.js";
import { renderRightsPage } from "../scripts/lib/seo-pages.js";

test("training restrictions preserve general and AI search crawler access", () => {
  const groups = renderRobots("https://uiwwsw.github.io").trim().split(/\n\n/);
  const rules = agent => groups.find(group => group.split("\n").includes(`User-agent: ${agent}`)) || groups[0];
  for (const agent of ["Googlebot", "Bingbot", "Yeti", "OAI-SearchBot", "Claude-SearchBot"])
    assert.equal(rules(agent), "User-agent: *\nAllow: /");
  for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot"])
    assert.match(rules(agent), /Disallow: \/$/);
  assert.equal(groups.at(-1), "Sitemap: https://uiwwsw.github.io/sitemap.xml");
});

test("rights page keeps legal exceptions, licenses and technical limits explicit", () => {
  const $ = load(renderRightsPage());
  assert.equal($("link[rel='canonical']").attr("href"), `https://uiwwsw.github.io${RIGHTS_PATH}`);
  assert.equal($("h1").text(), "콘텐츠 이용 안내");
  for (const phrase of ["법령상 허용되는 이용", "기존에 부여된 이용 허락", "소스 코드와 제삼자 자료의 기존 라이선스는 변경하지 않습니다", "자발적 준수", "완전히 막지 못합니다"])
    assert.ok($("main").text().includes(phrase));
  assert.ok(!/noindex|nosnippet/.test($("meta[name='robots']").attr("content")));
});
