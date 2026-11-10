# Cedar Trips 当前交接

整理日期：**2026-11-11，Asia/Shanghai，PR #39 更新前的远端复核**。当前来源报告捕获于 11 月 10 日；本次没有重新抓取官方网页、续期事实或接受基线。生产 HTTP 最近验收仍是 11 月 5 日，候选预览实际 HTTP 验收是 11 月 6 日；均不能冒充今日验收。先读根目录 [AGENTS.md](../../AGENTS.md)，再按本页接续。历史来源全文比较见 [11 月 5 日审阅](../source-review-2026-11-05.md)，项目决策见 [推进历史](history.md)，优先级见 [后续计划](roadmap.md)。

## 本次核对到的状态

| 项目 | 已核对事实与时间 |
| --- | --- |
| 远端 main | `e3aa2c44cae61bf1a3cf24c55693c62aee81b973`，对应 11 月 10 日合并的来源状态 PR [#44](https://github.com/jageros/travel/pull/44)。相比原起点 `b4b6249` 多五个监测提交，仅改 sources/health/queue 三个 JSON |
| 接续分支 | 远程 `codex/resume-2026-11-05`；本地 `codex/pr39-refresh-2026-11-11` 已正常合入上述 main，无冲突，原候选及查询词数据保留。本页随 PR 更新，最终提交以 PR head 为准 |
| 正式内容 | **6 篇发布记录、5 次人工批准**；六篇正文及来源/健康/队列/批准发布账本与最新 main 一致，新稿仍 review，原 digest 未变 |
| 来源 | 固定 main 报告捕获于 `2026-11-10T08:23:06.790Z`（北京时间 16:23:06.790）：29 来源，20 unchanged、9 changed、0 conflict。候选两源 unchanged 且 hash 匹配已接受基线；三条事实 checkedAt 11 月 10 日、expiresAt 11 月 17 日 |
| 工作流 / 队列 | 最近五个来源状态 PR #40–44 已合入 main；本次未重复 dispatch。队列共 14 项，九项为当前 changed；F-line 与 Clipper 的四项是已恢复 unchanged 的历史记录，另有发布前的 waterfront 旧审批项 |
| Cloudflare / 线上 | 11 月 6 日 `e96983a` 对应 build `aeb003fd-bf6f-44b8-88e3-c73050dba803` success，实际预览 HTTP 已验收。11 月 11 日未复核 Google/Cloudflare 账号、生产活动 SHA或新 head 实际预览；新构建结果与实际 HTTP 验收分别记录 |
| PR / 验证 | 11 月 11 日读取 PR #39 仍 open/draft、旧 head `e96983a`、可合并；该旧 head 的 verify 与 Cloudflare 检查均 success。合入新 main 后必须读取新 head 的检查，不能沿用 [旧 verify run 42062734859](https://github.com/jageros/travel/actions/runs/42062734859) |
| 仓库保护 | 11 月 11 日重读仍为 `rulesets=[]`、`main.protected=false`、required checks 为空。可用 GitHub 工具不支持修改保护设置；草稿不请求 auto-merge。历史要求是 PR 合并、必过 GitHub Actions verify、严格保持分支最新，不新增必需审批人数或 bypass |
| 广告/扩稿 | 广告关闭，无付费调用。未改基线/事实日期/发布状态，未触发部署或重复 dispatch |

本次 main 来源报告满 24 小时的时间为 **11 月 11 日 16:23:06.790 北京时间**。超过后需要新的真实捕获；读取报告不会刷新它。候选两项来源在本报告中均通过，但事实日期、报告新鲜度、内容质量、额度和受保护合并仍是独立条件。

当前九个 changed ID：`bart-sfo`、`sfmta-fares`、`sfmta-travel-updates`、`sfmta-trip-planner`、`bart-advisories`、`bart-paying-fare`、`bart-tap-and-ride`、`bart-schedules`、`bart-official-app`。11 月 5 日三项 SFMTA 建议是旧捕获的逐项审阅，不能直接批准今天观测的新版本；需要取回最新完整捕获比较后再提出精确建议。两个 SFMTA lookup 于 11 月 5 日到期，两个 BART lookup 于 11 月 6 日到期；这些都不是本候选的直接引用。

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

### 已交付草稿 PR 的 review 候选

[pending/](pending/README.md) 保存了 11 月 2 日完成的原始候选快照。11 月 5 日本地接入下列两项，11 月 6 日已交付草稿 PR #39：

1. [review 稿](../../src/content/articles/sf-cable-car-vs-historic-streetcar.md)：区分 cable car 与 F-line historic streetcar，提供选车和核对上车点的方法。复用已登记 `muni-streetcar` 真实照片，两官方页和照片许可重审通过，未改原稿日期或正文。
2. [真实查询词输入](../../automation/gsc-opportunities.json)：采用保存的 11 月 2 日导出，10 月 19–30 日十行、16 展示、零点击，保留真实日期和编辑状态；未重建原始 CSV，也未把它写成今天的新导出。

原稿与本地 review 的 `articleDigest` 均为 `98e258c6b66870fc3c09d657a7076d4162975cb4c32fa830436d44268410c72d`。**src 中的 review 只进入本地预览，不进入正式构建或 sitemap；未有新人工批准/发布记录。** docs 下原件与 manifest 保留原貌。普通受保护 PR 合并后，现有自动流程才可能在所有当前门禁通过时发布；不需伪造第六次人工批准。

11 月 5 日本机在 `b4b6249` 加上述候选的基线上重新完成内容、类型、135/135 测试及双构建。正式 17 页排除候选，预览 18 页包含候选并验证 noindex、无 GA/广告、空 sitemap。F-line 在该报告恢复 unchanged；11 月 6 日没有伪造新的来源抓取。远程检查及实际预览必须以 PR 最终 head 为准，不能用本地结果代替。

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

- 11 月 6 日同一正常 GitHub 连接器成功创建分支、tree/commit、更新 ref 和创建草稿 PR #39，前一天的写入 403 当前未复现。读取确认当前用户 jageros 为 admin；安装 `131554876` 的 selected repositories 确实包含 travel。工具未返回该安装的名称或 Contents 权限值，不能反推昨日具体原因，也没有修改授权。GitHub 配置页为 `https://github.com/settings/installations/131554876`；勿与单独的 Editorial App 混淆。
- 11 月 11 日用户明确允许改用已连接 GitHub 工具推进 PR #39。本轮按此授权读取和交付 GitHub 变更；Google/Cloudflare 后台操作仍按用户的内置浏览器偏好，尚未取得当前账号页面的读写能力。
- Chrome 控制工具于 11 月 5–6 日在执行 UI 前报 `sandboxCwd is not a local file URI: file:///mnt/d/workspace/travel`，重置后仍失败；未打开或修改 Chrome、Cookie、GitHub 网页权限。它是独立的本地路径/工具初始化错误，不是已证实的 GitHub 403 原因。GitHub 插件应用内权限仍继承默认 Allow low-risk actions。
- SSH 22 端口网络不通，公开仓库通过 HTTPS clone 成功；origin 保留用户给定的 SSH 地址，仅对本仓库配置 GitHub 官方 443 SSH 入口。本次交付通过已恢复的原连接器完成，没有改用 SSH 写入。
- 不把 public/private、个人浏览器已登录、连接器写权限混为一谈。明确拒绝后不以 SSH 凭证、raw CDP、其他浏览器或新 token 绕过。不扩大权限，保留普通 PR 交付。
- 既有专用 Editorial GitHub App 仅装到此仓库；`EDITORIAL_APP_PRIVATE_KEY` 只在 Actions Secret。新电脑无需取出私钥。Cloudflare 构建凭证也不导出、不写入交接。
- Cloudflare Build：`npm ci && npm run build:cloudflare`；生产命令 `npx wrangler deploy`；预览命令 `npx wrangler preview`；Node 24，Wrangler 由锁文件固定。build wrapper 根据 `WORKERS_CI_BRANCH` 隔离生产/预览。
- 正式 www，裸域 308 同路径/参数；DNS 保留 Google TXT 与无关记录。`workers.dev`/Version URLs 关闭，分支预览用 `previews.cedartrips.com`。Vercel 已删除，不再建立 Vercel 项目或恢复旧域名旅游站。
- 生产验收：已发布页 200/静态正文/内链/真实照片许可，未发布和未知路径 404，sitemap 只正式页面，canonical/OG/JSON-LD 指向 www；预览 noindex、无 GA/广告、空 sitemap。GA 同意后的验收事件与真实增长分开。
- 回退保留最新来源、批准和发布状态；若旧静态版本含过期事实，使用目标代码和最新状态重新构建，不能直接恢复旧账本。

11 月 5 日的 `npm audit` 快照记录 3 moderate/1 high，11 月 11 日未刷新审计。旧报告涉及开发工具链：`fast-uri@3.1.8` 经 Astro 检查工具，`undici@7.29.1` 经 Wrangler/Miniflare，另两项为上游继承。正式静态页面不执行这些 Node 工具，但本地/部署链仍需单独更新验证；未擅自 `audit fix` 或改锁文件。另有待补强项：CI 尚不自动比对已发布正文与批准账本 digest，真实 Cloudflare 预览仍需独立验收。详见 roadmap，不把本次候选检查说成这些缺口已修复。

聊天中已有每周一 **10:30 Asia/Shanghai** 的 `cedar-trips` 复盘；首五篇一次性验收 `cedar-trips-2` 于 10 月 28 日完成后删除。它们属于 Codex 账号/应用，**不是 GitHub workflow，也不随 clone 自动创建**。新机器先查现有自动化，避免重复。复盘无新可行动信号时安静，完成改进、失败/风险、明确搜索信号或需用户决定时才通知。

## 如何更新交接

完成实质变更后更新本页的核验日期与范围，向 history 追加真实结果，调整 roadmap 的下一步；给出 PR/head、检查、部署和数据日期。失败保留失败，外部等待保留等待。`docs/*-2026-*.md` 是历史快照，后来的事实写入新记录，不篡改旧验收。新的接续会话不能从计划推断工作已经发生。
