# Cedar Trips 当前交接

整理日期：**2026-11-27，Asia/Shanghai**。本页同时记录当前自动发布改动和 11 月 5 日历史快照。下次必须重新核对远端、运行记录和部署。先读根目录 [AGENTS.md](../../AGENTS.md)，再按本页接续。项目决策见 [推进历史](history.md)，执行优先级见 [后续计划](roadmap.md)。

### 2026-11-27 定时任务快照

- 逐篇发布猛犸洞国家公园（`c04ab01`）、Cane River Creole 国家历史公园（`1fcc877`）和亚当斯国家历史公园（`a553806`），用完当天三个英文名额。各提交均通过 GitHub、Cloudflare 以及正式页面、配图、canonical 和 sitemap 核验。 [猛犸洞](https://www.cedartrips.com/destinations/mammoth-cave-national-park/) · [Cane River Creole](https://www.cedartrips.com/destinations/cane-river-creole-national-historical-park/) · [亚当斯](https://www.cedartrips.com/destinations/adams-national-historical-park/)
- `84d7574` 补入蒙大拿州 Glacier、内布拉斯加州 Agate Fossil Beds 和内华达州 Great Basin。已核对每篇的 NPS 证据和 Commons 实景照片，队列从三篇恢复到六篇，三个待发页在正式站返回 404，sitemap 未列入。 [补稿 CI](https://github.com/jageros/travel/actions/runs/45923192299/job/140258463268)
- `407aadb` 为三篇新稿发布 33 份译文。242 份译文校验、168 项测试、生产 403 页和预览 409 页静态核验通过。正式站核验 36 个文章 URL 的标题、语言标记、canonical、双向 hreflang、六个本地 JPEG 和 402 个唯一 sitemap URL。 [译文 CI](https://github.com/jageros/travel/actions/runs/45923454174/job/140259285026) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 最近一次全量抓取为 `2026-11-27T01:28:05.594Z`。101 项来源中 92 项匹配基线，证据冲突为零。三个 Clipper 来源的抓取再次返回 403，六个 BART 来源也返回 403。补稿另核验并登记九项 NPS 来源。

### 2026-11-26 定时任务快照

- 逐篇发布 Andersonville 国家历史遗址（`b26a22a`）、City of Rocks 国家保护区（`2a34f5c`）和布朗诉教育委员会国家历史公园（`b9f8b18`），用完当天三个英文名额。逐篇核对对应提交的 GitHub、Cloudflare、正式页面、配图、canonical 和 sitemap。 [Andersonville](https://www.cedartrips.com/destinations/andersonville-national-historic-site/) · [City of Rocks](https://www.cedartrips.com/destinations/city-of-rocks-national-reserve/) · [布朗诉教育委员会](https://www.cedartrips.com/destinations/brown-v-board-of-education-national-historical-park/)
- `178f323` 补入马里兰州 Antietam、密歇根州 Isle Royale 和明尼苏达州 Voyageurs 三篇待发稿。逐篇核对 NPS 证据和 Commons 实景照片，待发队列从三篇补到六篇。三个待发路由在线上返回 404，sitemap 未列入。 [补稿 CI](https://github.com/jageros/travel/actions/runs/45736501681/job/139630921273)
- `c85fba0` 为当天三篇原文发布 33 份译文。209 份译文校验、168 项测试和生产 367 页、预览 373 页静态核验通过。正式站核验 36 个文章 URL 的标题、语言标记、canonical、双向 hreflang，以及六个本地 JPEG 和 366 个唯一 sitemap URL。 [译文 CI](https://github.com/jageros/travel/actions/runs/45737051849/job/139632707073) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 最后一次全量抓取为 `2026-11-26T01:25:47.899Z`。92 项来源中 86 项匹配基线，证据冲突为零。三个此前不可用的 Clipper 来源恢复并匹配基线。六个 BART 来源仍不可用，其中五项返回 403，一项连接抓取失败。补稿另核验并登记九项 NPS 来源。

### 2026-11-25 定时任务快照

- 逐篇发布印第安纳沙丘国家公园（`2233da6`）、林肯故居国家历史遗址（`21a3380`）和 Effigy Mounds 国家纪念地（`9e65caf`），用完当天三个英文名额。逐篇核对对应提交的 GitHub、Cloudflare、正式页面、配图、canonical 和 sitemap。 [印第安纳沙丘](https://www.cedartrips.com/destinations/indiana-dunes-national-park/) · [林肯故居](https://www.cedartrips.com/destinations/lincoln-home-national-historic-site/) · [Effigy Mounds](https://www.cedartrips.com/destinations/effigy-mounds-national-monument/)
- `744f897` 补入肯塔基州 Mammoth Cave、路易斯安那州 Cane River Creole 和马萨诸塞州 Adams 三篇待发稿。队列从三篇恢复到六篇，三个待发路由在线上返回 404，sitemap 未列入。Antietam 入队抓取重试仍失败，采用同轮已核验的 Adams 提案。 [补稿 CI](https://github.com/jageros/travel/actions/runs/45527819922/job/138915421803)
- `8cbc8c4` 为当天三篇原文发布 33 份译文。176 份译文校验、168 项测试和生产 331 页、预览 337 页静态核验通过。线上核验 36 个文章 URL 的标题、语言标记、canonical 和双向 hreflang、六个本地 JPEG 和 330 个唯一 sitemap URL。 [译文 CI](https://github.com/jageros/travel/actions/runs/45528107207/job/138916374032) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 最后一次全量抓取为 `2026-11-25T01:37:09.458Z`。83 项来源中 74 项匹配基线，9 项 BART/Clipper 仍返回 403，证据冲突为零。补稿另核验并登记九项 NPS 来源。

### 2026-11-24 定时任务快照

- 依次发布温泉国家公园（`ea7af61`）、甘尼森黑峡谷国家公园（`dd3731f`）和哈莱阿卡拉国家公园（`401e33f`），用完当天三个英文名额。逐篇核对了对应提交的 GitHub、Cloudflare、正式 URL、配图、canonical 与 sitemap。 [温泉国家公园](https://www.cedartrips.com/destinations/hot-springs-national-park/) · [甘尼森黑峡谷](https://www.cedartrips.com/destinations/black-canyon-of-the-gunnison-national-park/) · [哈莱阿卡拉](https://www.cedartrips.com/destinations/haleakala-national-park/)
- `dcde7cc` 将佐治亚州 Andersonville、爱达荷州 City of Rocks 和堪萨斯州 Brown v. Board of Education 三篇稿件补入队列，恢复至六篇。逐篇核对了 NPS 来源、证据和 Commons 实景照片的许可。三个待发路由正式站均返回 404，sitemap 未列入。 [补稿 CI](https://github.com/jageros/travel/actions/runs/45305446436/job/138148065908)
- `0a6c861` 为当天新发攻略独立发布 33 份译文，计划中的 Acadia 已有全套译文。143 份译文校验、168 项测试、生产 295 页与预览 301 页静态检查通过。正式站核验了 36 个文章 URL 的标题、语言标记、canonical 和双向 hreflang，并核对六个本地 JPEG 与 294 个唯一 sitemap URL。 [译文 CI](https://github.com/jageros/travel/actions/runs/45305765865/job/138149107645) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 最后一次全量抓取为 `2026-11-24T01:25:14.220Z`。74 项来源中 65 项匹配基线，9 项 BART/Clipper 仍返回 403，证据冲突为零。补稿另核验并登记九项 NPS 来源。

### 2026-11-23 定时任务快照

- 当天逐篇发布巴尔博亚公园（`31467d6`）、旧金山 F 线海滨无台阶出行指南（`dc82b41`）和阿卡迪亚国家公园（`3ee28dd`），用完三个英文名额。每篇提交均通过 GitHub、Cloudflare 与正式页核验。 [巴尔博亚公园](https://www.cedartrips.com/destinations/balboa-park/) · [F 线指南](https://www.cedartrips.com/guides/sf-waterfront-step-free-transit-planning/) · [阿卡迪亚](https://www.cedartrips.com/destinations/acadia-national-park/)
- `7a4fa08` 补入爱荷华州 Effigy Mounds 和伊利诺伊州 Lincoln Home 两篇待发稿，队列从四篇恢复至六篇。正式站两条待发路由均返回 404，sitemap 无对应条目。City of Rocks 的入队抓取失败，本轮使用已核验的其他候选。 [补稿 CI](https://github.com/jageros/travel/actions/runs/45099111263/job/137445585748)
- `ded7480` 独立发布三篇原文的 33 份译文。110 份译文校验、168 项测试和生产 259 页、预览 265 页静态核验通过。线上核验 36 个文章 URL 的标题、canonical、语言标记及双向 hreflang，并验证五个本地 JPEG 和 258 个唯一 sitemap URL。 [译文 CI](https://github.com/jageros/travel/actions/runs/45099371377/job/137446408917) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 英文发布的来源报告捕获于 `2026-11-23T02:09:42.544Z`。70 项来源有 61 项匹配基线，9 项 BART/Clipper 仍返回 403，零证据冲突。补稿另核验并登记四项 NPS 来源。11 月 22 日中断的巴尔博亚本地改动已留存备查，11 月 23 日在重新核验来源后才首次送达远端。

### 2026-11-21 定时任务快照

- 北京时间当天的三个英文名额已用完。自由女神像（`3286fed`）、国家广场（`1d29cd1`）和肯尼迪航天中心（`4319744`）逐篇发布。三个提交均通过 GitHub 验证、Cloudflare 生产构建和正式页面、配图、canonical、sitemap 检查。
- `48076f6` 补入科罗拉多州甘尼森黑峡谷、夏威夷州哈莱阿卡拉和印第安纳州印第安纳沙丘三篇 `review` 稿件。三张 Commons 实景图均核对了主体、署名、许可与原图哈希。待发队列恢复至六篇，新待发路由在正式站返回 404，sitemap 未列入。
- `46a60d0` 为三篇新英文稿发布 33 份译文。168 项测试、77 份译文校验通过，生产和预览分别核对 223、229 个 HTML 页面。GitHub 与 Cloudflare 同一 SHA 检查通过。正式站逐条核对三篇原文及其 33 份译文的 HTTP 200、canonical、语言标记和双向 hreflang，sitemap 共 222 个唯一 URL。[CI](https://github.com/jageros/travel/actions/runs/44850146138/job/136679311051) · [sitemap](https://www.cedartrips.com/sitemap.xml)
- 最后一次全量抓取报告时间为 `2026-11-21T01:21:12.075Z`。61 条已查来源中，52 条匹配基线、九条 BART/Clipper 来源仍返回 403，零证据冲突。补稿随后追加九条官方来源，已单独抓取核验，下一轮全量检查会重新获取。

### 2026-11-21 语言按钮

- 根据用户反馈，语言切换按钮仅显示当前语言名和下拉箭头，移除了「文」图标及其圆形样式。

### 2026-11-20 定时任务快照

- main 已同步到 `0076aa0`。本轮景点队列仍有 6 篇可用 `review` 稿件，没有新的候选需要补稿。
- 翻译计划选择四篇英文原文，前三篇景点译文保持完整，旧金山 cable car 与 F-line 文章的 11 种语言译文已通过来源报告、sourceDigest、补充指纹和质量门禁并发布。
- 本地验证通过 168 项测试、译文校验 44/44、生产构建 187 页和预览构建 193 页。提交对应的 GitHub verify 和 Cloudflare production build 均成功。
- 正式站西班牙语和阿拉伯语旧金山交通译文返回 200，canonical 和语言标记正确。sitemap 返回 186 个唯一 URL，其中该文章有 12 个语言版本。
- 多语言 UI 修正已合并到 `main` 的 `1fb93c7`。语言切换改为右上角原生下拉菜单，修正了菜单继承主导航样式造成的间距问题，并本地化固定文案、事实复核提示、图片署名、Cookie 控件和未翻译的内部链接。三条正式站抽查页面均只保留当前语言下拉，旧的平铺语言栏已移除。

### 2026-11-19 多语言改造快照

- 首批语言注册表包含英语默认页和西班牙语、法语、德语、巴西葡萄牙语、简体中文、繁体中文、日语、韩语、意大利语、阿拉伯语、印地语。英文 URL 保持不变，其他语言使用 `/{locale}/` 前缀。
- 已加入独立译文集合、原文和补充景点数据指纹、11 种语言的公共静态路由、文章路由、语言切换、`lang`/`dir`、canonical、Open Graph、双向 `hreflang`、`x-default` 和带 XHTML alternates 的 sitemap。缺失或过期译文不生成生产路由。
- 首批三篇景点各有 11 份受控译文，共 33 份。当前本地运行已通过不超过 24 小时的官方来源报告、逐项 unchanged 哈希和事实冲突门禁并提升为 `published`。合并后的 CI、Cloudflare 构建和生产 HTTP 验收仍是正式上线条件。
- `scripts/translation-pipeline.mjs` 每轮最多处理四篇英文原文，保存和发布独立于英文账本与每日一至三篇配额。现有 `cedar-trips` 定时任务已接入补稿后翻译计划、来源门禁、独立构建和竞态检查。
- 本轮验证通过 `npm run check`、168 项测试、译文校验 33/33、生产静态构建 176 页和预览静态构建 182 页。合并提交 `94572b4` 的 GitHub `verify` 与 Cloudflare production build 均成功。正式站的西班牙语 Grand Canyon、阿拉伯语 Yosemite、简体中文 Yellowstone 页面返回 200，语言标记、canonical、hreflang 和本地 JPEG 均已核对；sitemap 返回 175 个唯一 URL，其中 Grand Canyon 有 12 个语言版本。

## 当前代码工作区

- 自动补稿以六篇可用景点待发稿为目标，现有日常任务每次最多补三篇。按 NPS 州索引优先补覆盖较少的州，核验官方资料、逐项证据与真实 Commons 照片，随后单独提交 `review` 稿件和配套登记。补稿、定时任务和正式发布的验收彼此独立。 [运行手册](../automation.md#automatic-destination-queue-refill)
- 11 月 19 日实抓 NPS 与 Commons，通过补稿入口录入缅因州 Acadia 和阿肯色州 Hot Springs，将储备从四篇补到六篇。两篇保持 `review`，发布账本未改。照片及许可分别为 [Z3lvs 的 Acadia 海岸实景](https://commons.wikimedia.org/wiki/File:Granite_sea_cliffs_and_surf_along_Ocean_Path,_Acadia_National_Park,_Maine.jpg)和 [daveynin 的 Fordyce Bathhouse 实景](https://commons.wikimedia.org/wiki/File:Fordyce_Bathhouse_overview_and_Visitor_Center_(26393743389).jpg)。
- 每个北京时间自然日最多发布三篇，定时任务继续在北京时间 09:15 运行，有合格稿件时逐篇推进一至三篇。11 月 19 日过渡当天上限为四篇，额外名额用于当日要求的单篇发布。发布结果以账本、远端提交与生产验收为准。
- 优胜美地使用 11 月 19 日一次性过渡名额，已随 `4085f71` 发布。正式页面、配图与 sitemap 已核对。 [正式页面](https://www.cedartrips.com/destinations/yosemite/)
- 已发布 Grand Canyon（`403ab1c`）与 Yellowstone（`108e8fd`）。黄石单篇自动发布通过四项 NPS 来源检查、GitHub CI 和 Cloudflare 生产构建。线上黄石页、封面、分享图、响应式图、目录与 sitemap 返回 200。黄石在 sitemap 中出现一次，当时其余五篇草稿返回 404。
- 地区和类别筛选采用贴在控件下方的主题菜单。Chrome 复核了 26 个预览页面、320 至 1440px 六种宽度，以及筛选的鼠标、触控、键盘、减弱动态效果和无 JavaScript 状态。全站走查也修正了窄屏搜索溢出、重置焦点、导航点击区域与面包屑换行。
- 本轮景点改版从 `main` 的 `f3f6718` 开始。首次由当前会话自动发布的旧金山文章记录在 `d80a156`，该提交及历史备查证据仍见下文。
- 景点改版将 `/destinations/` 设为首页主入口，增加地区与类别筛选；七篇新景点稿备在内容目录，已有的 Golden Gate Bridge 页面在原路径加入景点亮点。首批名单见 [后续计划](roadmap.md)。
- 首批八个景点都有已核实许可的真实封面，新增七张本地照片来自 Wikimedia Commons 和 Pexels。来源登记新增 27 个官方页面，隔离实测均通过，九个既有 BART/Clipper 403 继续标记为 unavailable。
- 在隔离副本用当前 Search Console JSON 和实时来源运行发布选择，选中 Grand Canyon 并通过限定 slug 的发布门禁，验证账本指纹与实际稿件一致。本条记录是隔离验收；正式发布以 `automation/editorial.json`、远端提交及对应 HTTP 检查为准。
- 本地景点改版验证通过，内容 14 篇，Astro 零诊断，142 项测试，生产输出 19 页、预览输出 26 页。Chrome 核对了桌面与 393px 布局、八张封面裁切和署名，以及地区与类别的组合筛选、空结果与重置。
- 当前 Codex 会话的 `cedar-trips` 定时任务在本地 `main` 上抓取登记的官方来源，按已导入的 Search Console 机会给 `ready` 主题排序，在当日剩余配额内逐篇复用已验证稿件或使用当前会话模型生成 Markdown。通过构建验证后直接提交 `main`。`automation/editorial.json` 已设为 `requiredManualApprovals: 0` 和 `fullyAutomatic: true`。
- changed 来源只有在抓取成功、所有登记 evidence 片段仍存在且来源没有人工事实时自动推进 baseline 和证据日期。缺失 evidence、人工事实、不可用来源、过期事实、重复或质量失败会留在队列中，等待下一次自动运行。
- 首次旧金山自动发布快照，内容校验 7 篇，Astro 60 个文件零诊断，138 项测试，生产构建 18 页。提交 `d80a156` 的 [GitHub 验证](https://github.com/jageros/travel/actions/runs/44446625851)和生产构建成功，首页、sitemap、文章页返回 200，未知路径返回 404。
- 首次旧金山自动发布的来源报告捕获于 `2026-11-19T02:34:04.369Z`。当时 20 个来源基线匹配，9 个 BART/Clipper 来源返回 403，证据冲突为零。搜索数据仍是历史导入。

接续时先核对当前远端 SHA、账本与实际部署。部署与内容提交分别验收。

## 历史快照：2026-11-05

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
5. 读取本次 main 的账本、sources、health、queue、文章、照片登记与 scheduled task 状态，重算当日配额和待发队列。发布使用登记的官方来源和已导入的真实 Search Console 数据。补稿按已允许的 NPS 主机与 Commons 照片核验流程追加资料。docs 下的历史候选稿仍仅供接续参考。
6. 代码和 workflow 变更走普通受保护 PR。内容和来源状态由 Codex scheduled task 在生产验证和 main 竞态检查通过后直接提交 `main`。提交成功仍需单独核对 Cloudflare 部署、生产 SHA、HTTP 和 sitemap。

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

**有副作用的命令**包括 `npm run sources:check`、无参数 `node scripts/content-pipeline.mjs` 和 `node scripts/destination-intake.mjs --enqueue`。前两条会联网更新来源、健康、队列或报告。入队命令会追加通过核验的来源、照片、选题和待发稿。照片预览只写入 ignored 报告。运行定时任务前必须确认当前工作区和账本状态。

每日北京时间 09:15 的 Codex scheduled task 会执行完整自动流程。保持电脑和 Codex 桌面应用运行，避免与其他任务重复。自动化细节见 [automation.md](../automation.md)。

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
