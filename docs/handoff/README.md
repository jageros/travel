# Cedar Trips 当前交接

整理日期：**2026-11-05，Asia/Shanghai**。本页记录本次读取与历史证据的边界；下次必须重新核对。先读根目录 [AGENTS.md](../../AGENTS.md)，再按本页接续。项目决策见 [推进历史](history.md)，执行优先级见 [后续计划](roadmap.md)。

## 本次核对到的状态

| 项目 | 已核对事实与时间 |
| --- | --- |
| 远端 main | 11 月 5 日通过 GitHub 连接器读取为 `7db90ca2d220a3497dac0d966e29c4bce528ac10`，即 11 月 4 日合并的来源状态 PR [#37](https://github.com/jageros/travel/pull/37) |
| 本地起点 | 整理前当前 worktree 为 detached `2b5cec0`。远端比它多 7 个来源监测提交，只改 `sources.json`、`source-health.json`、`review-queue.json`；不能用这个本地起点判断最新健康状态 |
| 本地分支整理 | 同日按用户要求审计 20 个本地分支：18 个非 main 分支已是 main 的祖先，唯一未合入的交接提交 `e5ee3a4` 已快进并入本地 main；随后用 `git branch -d` 删除全部 19 个已合并本地分支，只保留 main。未同步或删除远端分支，未触发部署；本地最新 SHA 以 `git log -1` 为准 |
| 正式内容 | 最新远端账本仍有 **6 篇发布记录、5 次人工批准**；正文和原批准未在上述 7 个提交中变化 |
| 来源 | 最新报告捕获于 `2026-11-04T07:28:34.307Z`（北京时间 15:28:34）：29 来源，19 unchanged、10 changed、0 conflict；登记 35 条事实 |
| 工作流 | 11 月 4 日 [来源监测 run 41792468825](https://github.com/jageros/travel/actions/runs/41792468825) success；PR #37 head `e791ea5` 的三个检查运行均 success |
| Cloudflare | `7db90ca` 的 `Workers Builds: cedar-trips` check success，指向 [build 3103a2e7](https://dash.cloudflare.com/34d77ab5bdb83622d58fe9ff1ac1b695/workers/services/view/cedar-trips/production/builds/3103a2e7-7281-4278-be5c-b363d735e201)。本次未进仪表盘复核活动版本/100% 分流，也未重做生产 HTTP 验收 |
| PR | 本次读取 open PR 列表为空；下面的候选稿尚无远端 PR |
| 广告/扩稿 | 广告关闭；无付费模型调用或付费扩稿配置；本次只整理文档和交接材料 |

来源报告满 24 小时的时间为 **11 月 5 日 15:28:34 北京时间**；超过后不能继续沿用其新鲜度。即使尚在 24 小时内，changed 来源也不能发布。事实的 `expiresAt` 与抓取新鲜度是两个独立条件。

当前 10 个 changed ID：`bart-sfo`、`sfmta-fares`、`sfmta-f-line`、`sfmta-travel-updates`、`sfmta-trip-planner`、`bart-advisories`、`bart-paying-fare`、`bart-tap-and-ride`、`bart-schedules`、`bart-official-app`。这是观测变化，不是已经确认票价或服务发生变化；本次没有接受任何新基线。

两条 Sausalito 人工事实 `sausalito-bus-return-manual`、`sausalito-ferry-daytype-manual` 仍于 **10 月 24 日**到期，不能用稳定的静态页面 shell 自动续期。`review-queue.json` 中 10 月 28 日 06:50Z 的 waterfront 人工审批错误是实际发布前的历史项，不代表后来自动发布失败，也不能补造审核人。

### 已发布页面

| 路径 | 实际发布时间（北京时间） | 批准方式 |
| --- | --- | --- |
| `/guides/san-francisco-without-a-car/` | 10 月 20 日 20:18:20.750 | jageros 精确版本 |
| `/guides/bart-vs-muni-clipper/` | 同上 | jageros 精确版本 |
| `/guides/sfo-to-fishermans-wharf-with-luggage/` | 同上 | jageros 精确版本 |
| `/guides/is-muni-pass-worth-it/` | 10 月 28 日 16:54:28.653 | jageros 精确版本 |
| `/destinations/golden-gate-bridge-without-a-car/` | 同上 | jageros 精确版本 |
| `/guides/sf-waterfront-transit-itinerary/` | 同上 | 首五篇实际发布后依规则自动发布；`manualApproval=false` |

按本次读取的账本，最近三篇的七天窗口已于 **11 月 4 日 16:54:28.653**结束；若之后没有新发布，可用额度为三篇。执行时必须重新读取账本和当前时间，不能据本表直接发布。

## 可接续的实际成果

### 未进入生产内容的候选稿

[pending/](pending/README.md) 保存了 11 月 2 日完成、原先只在 ignored ZIP 中的两项完整文本，换电脑 clone 后仍可取得：

1. `sf-cable-car-vs-historic-streetcar` review 稿：区分 cable car 与 F-line historic streetcar，提供选车和核对上车点的方法。复用已登记 `muni-streetcar` 真实照片；不是新一篇通票算价文章。
2. 真实 Search Console 导出的 10 条查询词候选 JSON。保留原观测日期，不重建原始 CSV，不自动产生文章。

原稿 `articleDigest` 为 `98e258c6b66870fc3c09d657a7076d4162975cb4c32fa830436d44268410c72d`。**这些文件在 docs 下只是交接文本，不是已批准或已发布文章，不参加本站路由、sitemap 或自动发布。**

11 月 2 日曾在 `61f196f` 内容基线上完成本地内容检查（7 篇）、Astro 检查（61 文件，零诊断）、135/135 测试、生产/预览构建及静态验证。生产排除候选稿，预览包含它并强制 noindex、无 GA/广告、空 sitemap。**这不等于当前 main、远程 CI 或真实 Cloudflare 候选预览已通过。** 特别是 11 月 4 日 `sfmta-f-line` 新变为 changed，该稿再次提交前必须处理其来源变化；不得沿用 11 月 2 日的核验结论发布。

### 搜索和阅读数据：最新已实际读取的窗口

以下均来自 **11 月 2 日的真实后台/下载导出**，本次未刷新；不能标成 11 月 5 日的数据。

| 来源/实际数据窗口 | 观测 | 解释限制 |
| --- | --- | --- |
| Search Console，10 月 19–30 日可用日行 | 属性 151 展示、0 点击、CTR 0%、平均排名 17.9 | UI 选择过去三个月，末尾未可用日期不能记零；不是稳定排名或流量增长结论 |
| 同报表，10 月 24–30 日 | 111 展示、0 点击 | 与其他窗口比较必须对齐日期和口径 |
| 页面表，SFO/行李攻略 | 124 展示、0 点击、平均排名 15.75 | 页面聚合与属性聚合不同，不能强行加总对齐 |
| 公开披露的查询词行 | 10 行，共 16 展示、0 点击 | 隐私过滤后并非全部搜索；完整候选值见 pending JSON |
| GA4，10 月 26 日–11 月 1 日 | 1 session、1 active user，全部 Direct；3 page_view、20 events，其中 12 reading_depth；internal_navigation、view_search_results 均为 0 | 无 Organic Search 行可分析自然搜索落地/继续阅读；可能包含站主/验收访问，12 个事件不等于 12 位读者 |

11 月 2 日个别 URL 检查显示 Muni 比较与 Golden Gate 指南已收录；当时汇总索引报告只更新至 10 月 23 日，不能当成当日全站收录数。10 月 26 日导出截止 10 月 23 日为 40 展示，与后来的 151 展示是长度不同的累计窗口，不能称为周增长率。

原始导出、运行日志与截图继续留在 ignored `artifacts/`，不保证换电脑存在。没有实际账单或广告平台收入文件；不把 GA4 的 $0 字段当成 AdSense 收入，也不计算 RPM、净收益或“总成本为零”。

## 新电脑的接续顺序

1. 从 `jageros/travel` 获取包含这组交接文件的分支/提交；**仅保存到原机但尚未推送的提交，不会随另一台电脑 clone 出现**。不要依赖原机工作区绝对路径。
2. 读 `AGENTS.md`、本页、history、roadmap。查看 `git status --short --branch` 和 `git log -5 --oneline`；有本地改动先保留。在已获准的 Git 访问条件下 fetch，检查最新 `origin/main`，不覆盖用户改动、不强推 main。
3. 使用 Node 24（`.nvmrc`），运行 `npm ci`。本地 `.env` 可从 `.env.example` 建立；不要从原聊天复制密钥。
4. 重新连接所需工具/后台。已有标识：Search Console Domain property **cedartrips.com**；GA4 property **559805493**、measurement ID **G-QDDLYW7WRF**；Cloudflare Worker **cedar-trips**。登录和权限不会随 Git 转移。
5. 读取本次 main 的账本、sources、health、queue、文章、照片登记与 workflow，重算配额和来源状态。先处理 roadmap 中的来源阻塞，再移用 pending 稿；不从 docs 自动发布。
6. 普通受保护 PR → 当前 head 必过 CI → 真正的 Cloudflare 分支预览 → 合并 → 对应提交的实际生产部署与 HTTP 验收。不要把“请求 auto-merge”或成功 build check 直接写成生产已验收。

本地只读查看待审稿指纹：

```sh
node scripts/content-pipeline.mjs --list-review
```

与当前 CI 一致的代码/内容验证：

```sh
DEPLOYMENT_ENV=production SITE_INDEXING_ENABLED=true npm run verify
DEPLOYMENT_ENV=preview CONTENT_REVIEW_PREVIEW=true SITE_INDEXING_ENABLED=true npm run build
DEPLOYMENT_ENV=preview CONTENT_REVIEW_PREVIEW=true SITE_INDEXING_ENABLED=true npm run verify:build
CONTENT_REVIEW_PREVIEW=true npm run dev
```

预览默认 `127.0.0.1:4321`，端口占用时以命令输出为准。刻意给预览传 `SITE_INDEXING_ENABLED=true` 仍必须保持 noindex、无 GA/广告。纯交接文档变更不需要伪造或重跑整套文章验证；应检查链接和 payload 完整性。

**有副作用的命令**：`npm run sources:check`、无参数 `node scripts/content-pipeline.mjs` 都会联网并改写来源/健康/队列或报告；不是只读检查。后者无参数仅监测，`--publish` 才尝试发布，`--draft` 可能调用配置的外部模型，本项目不得为接续而运行付费扩稿。

手动仅监测：在 [editorial.yml](https://github.com/jageros/travel/actions/workflows/editorial.yml) 选择 main，保持 `publish_approved=false`、`generate_draft=false`、`accept_missing_baselines=false`，审批字段空白。每日 UTC 01:15 / 北京时间 09:15 的 schedule **会尝试发布**，可能延迟；先检查已有 run，不重复 dispatch。自动化细节见 [automation.md](../automation.md)。

导入新的实际查询词可用 `node scripts/import-gsc.mjs path/to/Queries.csv`，它会改写 `automation/gsc-opportunities.json`。保留真实日期与来源，不为缺失数据造 CSV。

## 访问与部署接续

- 11 月 5 日本次正常尝试：GitHub 连接器读取成功，为此交接创建 `codex/project-handoff-2026-11-05` 分支仍返回 `403 Resource not accessible by integration`，未创建远端分支/PR。11 月 3 日最后一次浏览器尝试在访问 github.com 前被 origin gate 拒绝，本次没有再次尝试。用户截图已显示 Browse/Download 始终允许，不能断言用户未授权。新电脑访问是否恢复必须重新验证；当前本地保存不等于已同步 GitHub。
- 不把 public/private、个人浏览器已登录、连接器写权限混为一谈。明确拒绝后不以 SSH 凭证、raw CDP、其他浏览器或新 token 绕过。不扩大权限，保留普通 PR 交付。
- 既有专用 Editorial GitHub App 仅装到此仓库；`EDITORIAL_APP_PRIVATE_KEY` 只在 Actions Secret。新电脑无需取出私钥。Cloudflare 构建凭证也不导出、不写入交接。
- Cloudflare Build：`npm ci && npm run build:cloudflare`；生产命令 `npx wrangler deploy`；预览命令 `npx wrangler preview`；Node 24，Wrangler 由锁文件固定。build wrapper 根据 `WORKERS_CI_BRANCH` 隔离生产/预览。
- 正式 www，裸域 308 同路径/参数；DNS 保留 Google TXT 与无关记录。`workers.dev`/Version URLs 关闭，分支预览用 `previews.cedartrips.com`。Vercel 已删除，不再建立 Vercel 项目或恢复旧域名旅游站。
- 生产验收：已发布页 200/静态正文/内链/真实照片许可，未发布和未知路径 404，sitemap 只正式页面，canonical/OG/JSON-LD 指向 www；预览 noindex、无 GA/广告、空 sitemap。GA 同意后的验收事件与真实增长分开。
- 回退保留最新来源、批准和发布状态；若旧静态版本含过期事实，使用目标代码和最新状态重新构建，不能直接恢复旧账本。

聊天中已有每周一 **10:30 Asia/Shanghai** 的 `cedar-trips` 复盘；首五篇一次性验收 `cedar-trips-2` 于 10 月 28 日完成后删除。它们属于 Codex 账号/应用，**不是 GitHub workflow，也不随 clone 自动创建**。新机器先查现有自动化，避免重复。复盘无新可行动信号时安静，完成改进、失败/风险、明确搜索信号或需用户决定时才通知。

## 如何更新交接

完成实质变更后更新本页的核验日期与范围，向 history 追加真实结果，调整 roadmap 的下一步；给出 PR/head、检查、部署和数据日期。失败保留失败，外部等待保留等待。`docs/*-2026-*.md` 是历史快照，后来的事实写入新记录，不篡改旧验收。新的接续会话不能从计划推断工作已经发生。
