# Cedar Trips 推进历史

本文件只记已发生的工作和已决定的边界；未来工作见 [roadmap](roadmap.md)，当前日期快照见 [交接](README.md)。截至 2026-11-05；更早的验收链接保留当时状态，不代表今天重新执行。

## 2026-10-19：内容与技术方向

- 原站以 100 条很短的景点种子为主，卡片打开 Google 搜索，存在打断点击的广告链、缺失 SEO 文件和未统一管理的外链图片。
- 决定面向美国英语读者，围绕具体旅行决策建设内容站；比较旧金山无车游、西南国家公园、纽约低预算三个候选主题，选择旧金山作为编辑可行性起点。没有编造搜索量或关键词难度。
- 改为 Astro 静态页面 + React 搜索 + Markdown；建立 topics/guides/destinations、SEO 模板、真实 404、来源事实、照片许可、信任说明和可控广告/统计组件。
- 前五篇人工确认精确版本，之后按质量/来源门禁自动发布；每滚动七天最多三篇，质量优先。见 [关键词研究](../keyword-research.md)、[自动化](../automation.md)。

## 2026-10-20：首五篇批准与首发

- jageros 确认五篇精确稿件；实际 digest 和 reviewer 登记于 `automation/editorial.json`，逐篇内容与照片边界见 [首五篇审阅包](../first-five-review.md)。批准不等于发布。
- 首批总览、BART/Muni/Clipper、SFO 行李接驳三篇于 `2026-10-20T12:18:20.750Z` 实际发布。另两篇当时等待配额；这一等待状态已于 10 月 28 日结束。
- 补上许可明确的本地真实照片及作者、Commons 文件页、许可、原图校验值；不把历史照片当成今日服务证据。
- 新品牌 **Cedar Trips**、主站 **https://www.cedartrips.com**。Search Console 加入新域；GA4 新建独立 property 559805493，避免与其他网站混合。
- 旧旅游域没有经营积累，用户决定删除 travel CNAME 并接受通配符回落，不要求迁移跳转；不修改 mumasir.com 其他站点。新域裸域保留到 www 的 308。
- 用户授权 Actions 建 PR、仓库 auto-merge、main 必过 verify；专用 Editorial GitHub App 仅限 travel，私钥留 Actions Secret。不是整个账号的无限权限。见 [首发记录](../launch-status-2026-10-20.md)。

## 2026-10-21：自动化验收与 Cloudflare 迁移

- 实际跑通来源监测 → App PR → 必过 CI → 普通受保护自动合并 → 部署。未把源基线变更纳入自动接受。
- 按用户决定从 Vercel 全迁 Cloudflare Workers Static Assets + Builds；先部署验收，再切 DNS，随后删除 travel Vercel 项目及历史部署，不设保留期。不影响其他项目/共享集成。
- 统一 www canonical；生产/预览隔离、安全头、缓存、真实 404、Cloudflare 分支预览完成。首次迁移时仍是三篇/sitemap 九条，是当时快照。
- 建立后续八个独立简报的官方资料与事实，使初始五篇可扩展至约十三篇；另三个重叠简报待评估。滨水区稿进入 review。
- 建立移动实验室基线并实测响应式图片优化；不是已获得生产真实用户 INP。
- 此时 GSC 数据仍 processing，GA 数据很小且为 Direct/验收兼容访问；无自然增长或广告收入结论。
- 详见 [迁移验收](../cloudflare-migration-2026-10-21.md)、[自动化验收](../automation-acceptance-2026-10-21.md)、[增长运营](../growth-operations-2026-10-21.md)、[移动性能](../mobile-performance-2026-10-21.md)。

## 2026-10-26：首次可下载搜索数据与来源处理

- 实际 GSC 可用日行为 10 月 19–23 日：40 展示、0 点击；7 条披露查询词合计 11 展示、0 点击。只导入真实导出，原始文件留 ignored artifacts。
- 修复来源状态历史混合时间的严格分类及 PR head 短暂不匹配的有限重试，并保留完整本轮 source snapshots，帮助逐项语义审核。没有自动接受新哈希。
- PR #23 正常合并 `211fb45`；监测 run #13、状态 PR #24 合并 `48e39d4` 并部署，恢复自动链路。
- 用户确认 8 项源基线更新；PR #25 后与自动监测状态发生两文件冲突，按已批准基线和真实最新捕获处理后由用户确认已合并。不得把 changed 健康行直接当成 unchanged。
- 两条 Sausalito 人工事实 10 月 24 日到期，未续期。见 [周复盘](../weekly-review-2026-10-26.md)、[来源审核](../source-review-2026-10-26.md)。

## 2026-10-28：首五篇全部发布，滨水区成为第六篇

- 用户确认来源审阅版本 `18f513c` 的 8 项更新；PR #29 正常合并，9 条事实语义不变。见 [逐源记录](../source-review-2026-10-28.md)。
- 用户手动启动既有发布 workflow；PR #30 受保护合并，main 为 `2b5cec0`。当天捕获 29 unchanged、无 conflict，保留原五个文章 SHA 与人工批准。
- Muni 比较、Golden Gate 指南于 `2026-10-28T08:54:28.653Z` 实际发布；首五篇完成后，滨水区按现有规则同轮自动发布。后三篇恰好占用滚动七天三篇额度，滨水区 `manualApproval=false`，没有审核人伪造。
- Cloudflare 正式 build `adc81a68` 成功，活动版本 `6eefb799` 100%；6 篇 200、静态正文/图片许可、sitemap 12、未知 404、同意后 GA 配置和广告关闭已验收。
- 曾有预览 build `2f7d49f4` 在 GitHub 仓库拉取阶段失败；重试 `d20d5a5f` 成功，unique version `c0bfcef1` 的实际 HTTP 预览 noindex、无 GA/广告、空 sitemap、未知 404。该旧失败已经恢复，不要反复当成当前生产故障。
- Google 当天实时测试可抓取两篇新页；当时尚不能说已收录。一次性首五篇验收自动化完成后删除，保留每周复盘。

## 2026-11-02–03：真实周复盘与未提交候选

- 11 月 2 日 GSC 下载实际日行为 10 月 19–30 日：151 展示、0 点击；SFO/行李页 124 展示。披露 10 个查询词合计 16 展示，不等于属性总量。Muni/Golden 个别 URL 检查已收录，汇总报告仍落后。
- GA4 实际 10 月 26 日–11 月 1 日只有 1 个 Direct session，未见 Organic Search 行；不当作自然流量增长。没有广告平台收入/成本账单，不计算 RPM/净收益。
- 现有 SFO 内容已覆盖早期查询意图，不因单次展示创建重复机场文章。准备 cable car 与 historic streetcar 的独立 review 稿及真实查询词更新。
- 候选在 `61f196f` 内容基线上通过 135/135 本地测试及生产/预览静态检查；**未创建远程分支/PR，未有该候选远程必过 CI 或真实 Cloudflare 预览**。源健康旧于 24 小时时仍正确阻止发布。
- 仓库短暂改 private 后连接器读 404，改回 public 后读恢复；11 月 3 日 main 为 `6341bfa`，写分支仍 403，内置浏览器 origin gate 仍拒绝。用户的权限截图显示始终允许；具体工具/界面不一致原因未确认。没有改用 SSH/CDP/其他浏览器绕过。
- 11 月 2 日实际 Cloudflare 生产 `61f196f` build `5431e6c3` 成功，活动版本 `356c28cf` 100%。这是最后一次此会话查看到的 100% 活动分流，不是 11 月 5 日重新验收。

## 2026-11-05：仓库接续记录

- 按用户要求新增根目录 Codex 入口、当前交接、历史与路线图；把原 ignored ZIP 中的候选文本保存到受版本管理的 `docs/handoff/pending/`，保持非生产状态。
- 只读核对远端 main `7db90ca`、来源 19 unchanged/10 changed/0 conflict、账本仍 6 篇/5 批准、open PR 为空、Cloudflare 对应 build check success；没有把它称为今日生产 HTTP/活动分流验收。
- 本次不更改文章、事实基线、事实日期、发布账本、广告或部署。交接文件的提交/远端同步结果以最终实际 Git/PR 记录为准；仅本机保存不意味着另机已可 clone。
- 本次通过既有连接器尝试创建 `codex/project-handoff-2026-11-05` 分支仍返回 403，未创建远端分支或 PR；没有改用其他访问通道绕过。文件先保存在本地受版本管理的独立提交，远端同步待完成。

## 2026-11-05（后续）：本地分支合并与清理

- 用户要求核对所有本地改动、合并至 main 并只保留 main。开始时主工作区 clean，20 个本地分支中 18 个非 main 分支均已成为 main 的真实祖先；没有需要重新应用的旧内容。
- 唯一未合入分支是 `codex/project-handoff-2026-11-05`，提交 `e5ee3a48a46e043082fcec8e779bf572978bd996`。本地 main 从 `2b5cec0` 快进到该提交，保存全部项目交接文件和非生产候选文本。
- 对照清理前快照验证全部分支 tip 均可从 main 到达，且六篇现有文章、照片许可登记、批准/发布账本、来源/健康/待审状态共 11 个 Git blob 未变。使用安全的 `git branch -d` 删除全部 19 个已合并本地分支，只保留 main；不丢弃提交历史。
- 保留 detached worktree、ignored 原始证据和已有本地配置。本轮无网络 Git 操作，不修改或删除远端分支，不部署、不发布文章，也不把本地旧 `origin/main` 当作服务器最新状态。
- 完整分支名和清理前 tip 清单保留于 ignored `artifacts/local-branch-consolidation-2026-11-05/`。本记录随本地 main 保存；远端同步仍走正常受保护流程。
