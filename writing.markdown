---
layout: default
title: Writing
---

<section class="section" aria-labelledby="writing-archive-heading">
  <div class="section__header">
    <p class="section__eyebrow">Writing</p>
    <h1 id="writing-archive-heading" class="section__title">실제 운영에서 얻은 기록 모음</h1>
    <p class="section__intro">빌드·배포·운영에서 겪은 이슈와 해결 과정을 정리한 글을 시간순으로 정리했습니다.</p>
  </div>

  <div class="posts-grid" role="list">
    {% for post in site.posts %}
      <article class="post-card" role="listitem">
        <p class="post-meta">{{ post.date | date: '%Y.%m.%d' }} · {{ post.categories | join: ' · ' }}</p>
        <h2 class="post-title">
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </h2>
        <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 160 }}</p>
        {% if post.tags %}
          <div class="post-tags" aria-label="태그">
            {% for tag in post.tags %}
              <span class="post-tag">{{ tag }}</span>
            {% endfor %}
          </div>
        {% endif %}
      </article>
    {% endfor %}
  </div>
</section>
